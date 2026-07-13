import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { DiagnosticService } from '../core/learning/DiagnosticService';
import { hashPin } from '../utils/saveSystem';
import type { NodeMastery } from '../core/types';
import StudentGraphModal from '../components/StudentGraphModal';
import styles from './StudentManager.module.css';

interface StudentProfile {
    id: string;
    name: string;
    score: number;
    stars: number;
    streak: number;
    last_played: string;
    hasAlert: boolean;
    bestSkill?: string;
    nodeMastery: Record<string, NodeMastery>;
    tabuadaMastery: Record<string, any>;
    masteredCount: number;
}

interface StudentManagerProps {
    classId: string;
    className: string;
    accessCode?: string;
    onClose: () => void;
}

export const StudentManager: React.FC<StudentManagerProps> = ({ classId, className, accessCode, onClose }) => {
    const [students, setStudents] = useState<StudentProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'report' | 'manage'>('report');
    
    // Manage state
    const [newStudentName, setNewStudentName] = useState('');
    const [batchNames, setBatchNames] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [createdPins, setCreatedPins] = useState<{name: string, pin: string}[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);

    useEffect(() => {
        if (activeTab === 'report' || students.length === 0) {
            fetchStudents();
        }
    }, [classId, activeTab]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, total_score, stars, streak, last_sync, session_stats, node_mastery, tabuada_mastery')
                .eq('class_id', classId)
                .order('name', { ascending: true });

            if (error) throw error;

            const mapped: StudentProfile[] = (data || []).map(p => {
                const nodeMastery: Record<string, NodeMastery> = p.node_mastery || {};
                const mockPlayer = { sessionStats: p.session_stats, skillsMastery: [], nodeMastery } as any;
                const insights = DiagnosticService.generateReport(mockPlayer);
                const hasAlert = insights.some((i: any) => i.status === 'needs_help');
                const bestSkill = insights.find((i: any) => i.status === 'mastered')?.skillName;
                const masteredCount = Object.values(nodeMastery).filter(nm => nm.mastered).length;

                return {
                    id: p.id,
                    name: p.name,
                    score: p.total_score || 0,
                    stars: p.stars || 0,
                    streak: p.streak || 0,
                    last_played: p.last_sync || new Date().toISOString(),
                    hasAlert,
                    bestSkill,
                    nodeMastery,
                    tabuadaMastery: p.tabuada_mastery || {},
                    masteredCount
                };
            });

            // Sort by score for report, by name for list
            if (activeTab === 'report') {
                mapped.sort((a, b) => b.score - a.score);
            }
            setStudents(mapped);
        } catch (err) {
            console.error('Erro ao buscar alunos:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateStudent = async (namesList: string[]) => {
        if (namesList.length === 0) return;
        setIsCreating(true);
        try {
            const newProfiles = [];
            const results = [];
            for (const name of namesList) {
                const cleanName = name.trim();
                if (!cleanName) continue;
                
                const pin = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit PIN
                const hashedPin = await hashPin(pin);
                const id = crypto.randomUUID();
                
                newProfiles.push({
                    id,
                    name: cleanName,
                    secret_code: hashedPin, // Store hashed pin
                    class_id: classId,
                    total_score: 0,
                    stars: 0,
                    streak: 1,
                    last_sync: new Date().toISOString()
                });
                results.push({ name: cleanName, pin });
            }

            if (newProfiles.length > 0) {
                const { error } = await supabase.from('profiles').insert(newProfiles);
                if (error) throw error;
                
                setCreatedPins(results);
                setNewStudentName('');
                setBatchNames('');
                fetchStudents();
            }
        } catch (e: any) {
            alert('Erro ao criar alunos: ' + e.message);
        } finally {
            setIsCreating(false);
        }
    };

    // Copia a lista de acesso (código da turma + PINs) para a área de transferência.
    const copyPins = async () => {
        const linhas = createdPins.map(cp => `${cp.name}: PIN ${cp.pin}`).join('\n');
        const texto = `Turma: ${className}\nCódigo de acesso: ${accessCode || '(veja no painel)'}\n\n${linhas}`;
        try {
            await navigator.clipboard.writeText(texto);
            alert('Lista copiada! Cole onde quiser (WhatsApp, e-mail, etc.).');
        } catch {
            alert('Não foi possível copiar automaticamente.');
        }
    };

    // Abre uma folha imprimível com um cartão de acesso por aluno.
    const printPins = () => {
        const cards = createdPins.map(cp => `
            <div class="card">
                <div class="name">${cp.name}</div>
                <div class="row"><span>Código da turma</span><b>${accessCode || '—'}</b></div>
                <div class="row"><span>Meu PIN</span><b>${cp.pin}</b></div>
            </div>
        `).join('');
        const html = `
            <html><head><title>Acessos — ${className}</title>
            <style>
                body { font-family: system-ui, sans-serif; padding: 20px; }
                h1 { text-align: center; }
                .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
                .card { border: 2px dashed #333; border-radius: 12px; padding: 14px; }
                .name { font-size: 1.2rem; font-weight: 800; margin-bottom: 8px; }
                .row { display: flex; justify-content: space-between; font-size: 0.95rem; margin: 4px 0; }
                .row b { font-size: 1.1rem; letter-spacing: 1px; }
                @media print { .card { break-inside: avoid; } }
            </style></head>
            <body>
                <h1>Trilha dos Campeões — ${className}</h1>
                <p style="text-align:center">Entregue um cartão para cada aluno. Ele entra com o código da turma + o PIN dele.</p>
                <div class="grid">${cards}</div>
                <script>window.onload = () => window.print();</script>
            </body></html>`;
        const win = window.open('', '_blank');
        if (win) { win.document.write(html); win.document.close(); }
    };

    // --- Analytics Calculations ---
    const totalStars = students.reduce((acc, s) => acc + s.stars, 0);
    const avgScore = students.length > 0 ? Math.round(students.reduce((acc, s) => acc + s.score, 0) / students.length) : 0;
    const activeToday = students.filter(s => {
        const d = new Date(s.last_played);
        const today = new Date();
        return d.toDateString() === today.toDateString();
    }).length;

    const getAttendanceData = () => {
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const result = [];
        for (let i = 4; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const count = students.filter(s => new Date(s.last_played).toDateString() === date.toDateString()).length;
            result.push({ label: days[date.getDay()], count });
        }
        return result;
    };

    const attendance = getAttendanceData();
    const maxAttendance = Math.max(...attendance.map(a => a.count), 1);

    return (
        <div className={styles.overlay}>
            <div className={styles.modal} style={{ maxWidth: '900px' }}>
                <div className={styles.header}>
                    <div className={styles.headerTitle}>
                        <span className={styles.badge}>B2B Premium</span>
                        <h2>Turma: {className}</h2>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>&times;</button>
                </div>

                <div className={styles.tabs} style={{ display: 'flex', gap: '10px', padding: '0 20px', borderBottom: '1px solid #ddd' }}>
                    <button 
                        onClick={() => setActiveTab('report')} 
                        style={{ padding: '10px 20px', borderBottom: activeTab === 'report' ? '3px solid var(--color-blue)' : 'none', fontWeight: 'bold', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer' }}
                    >
                        📊 Relatório Pedagógico
                    </button>
                    <button 
                        onClick={() => setActiveTab('manage')}
                        style={{ padding: '10px 20px', borderBottom: activeTab === 'manage' ? '3px solid var(--color-blue)' : 'none', fontWeight: 'bold', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer' }}
                    >
                        👥 Gerenciar Alunos
                    </button>
                </div>

                <div className={styles.content}>
                    {loading ? (
                        <div className={styles.loading}>Carregando dados...</div>
                    ) : (
                        <>
                            {activeTab === 'report' && (
                                <>
                                    <div className={styles.analyticsSummary}>
                                        <div className={styles.miniStat}>
                                            <label>Engajamento Hoje</label>
                                            <div className={styles.val}>{activeToday} / {students.length}</div>
                                            <div className={styles.subtext}>Alunos Ativos</div>
                                        </div>
                                        <div className={styles.miniStat}>
                                            <label>Média de Pontos</label>
                                            <div className={styles.val}>🎯 {avgScore}</div>
                                            <div className={styles.subtext}>Performance Geral</div>
                                        </div>
                                        <div className={styles.miniStat}>
                                            <label>Total de Estrelas</label>
                                            <div className={styles.val}>⭐ {totalStars}</div>
                                            <div className={styles.subtext}>Conquistas da Turma</div>
                                        </div>
                                        
                                        <div className={styles.attendanceChart}>
                                            <label>Assiduidade (Últimos 5 dias)</label>
                                            <div className={styles.barContainer}>
                                                {attendance.map((day, idx) => (
                                                    <div key={idx} className={styles.barGroup}>
                                                        <div 
                                                            className={styles.bar} 
                                                            style={{ height: `${(day.count / maxAttendance) * 100}%` }}
                                                        >
                                                            {day.count > 0 && <span className={styles.barVal}>{day.count}</span>}
                                                        </div>
                                                        <span className={styles.barLabel}>{day.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {students.length === 0 ? (
                                        <div className={styles.empty}>Nenhum aluno cadastrado. Vá em "Gerenciar Alunos" para adicionar.</div>
                                    ) : (
                                        <>
                                            <h3 className={styles.sectionTitle}>Ranking de Performance</h3>
                                            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 10px' }}>
                                                👉 Clique num aluno para ver a progressão dele na trilha.
                                            </p>
                                            <table className={styles.studentTable}>
                                                <thead>
                                                    <tr>
                                                        <th>Nome do Aluno</th>
                                                        <th>Trilha</th>
                                                        <th>Pontos</th>
                                                        <th>Estrelas</th>
                                                        <th>Foco (🔥)</th>
                                                        <th>Diagnóstico Pedagógico</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {students.map((student, idx) => (
                                                        <tr
                                                            key={student.id}
                                                            className={idx === 0 ? styles.topStudent : ''}
                                                            style={{ cursor: 'pointer' }}
                                                            onClick={() => setSelectedStudent(student)}
                                                            title="Ver progressão na trilha"
                                                        >
                                                            <td className={styles.nameCell}>
                                                                {idx === 0 && <span className={styles.crown}>👑</span>}
                                                                {student.name}
                                                            </td>
                                                            <td title="Habilidades dominadas no grafo curricular">
                                                                🧩 {student.masteredCount}
                                                            </td>
                                                            <td className={styles.scoreCell}>{student.score.toLocaleString()}</td>
                                                            <td>⭐ {student.stars}</td>
                                                            <td>
                                                                <span className={student.streak >= 3 ? styles.highStreak : styles.lowStreak}>
                                                                    {student.streak >= 3 ? `🔥 ${student.streak}` : `✨ ${student.streak}`}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {student.hasAlert && <span style={{color: 'var(--color-red)', fontWeight: 'bold'}} title="Precisa de atenção">⚠️ Requer Atenção</span>}
                                                                {!student.hasAlert && student.bestSkill && <span style={{color: 'var(--color-green)', fontWeight: 'bold'}}>🌟 Domina {student.bestSkill}</span>}
                                                                {!student.hasAlert && !student.bestSkill && <span style={{color: '#888'}}>Em Progresso</span>}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </>
                                    )}
                                </>
                            )}

                            {activeTab === 'manage' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
                                        <h3>Adicionar Alunos</h3>
                                        <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '15px' }}>
                                            Adicione alunos para gerar o PIN de acesso deles. Eles usarão o PIN para logar nos tablets.
                                        </p>
                                        
                                        <div style={{ marginBottom: '15px' }}>
                                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Adicionar Individual</label>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <input 
                                                    type="text" 
                                                    placeholder="Nome do Aluno" 
                                                    value={newStudentName}
                                                    onChange={e => setNewStudentName(e.target.value)}
                                                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                                />
                                                <button 
                                                    onClick={() => handleCreateStudent([newStudentName])}
                                                    disabled={isCreating || !newStudentName.trim()}
                                                    style={{ padding: '10px 20px', background: 'var(--color-blue)', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                                                >
                                                    {isCreating ? '...' : 'Adicionar'}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Adicionar em Lote (Cole a lista)</label>
                                            <textarea 
                                                placeholder="João Silva&#10;Maria Souza&#10;Pedro Santos"
                                                value={batchNames}
                                                onChange={e => setBatchNames(e.target.value)}
                                                style={{ width: '100%', height: '100px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '10px' }}
                                            />
                                            <button 
                                                onClick={() => handleCreateStudent(batchNames.split('\n'))}
                                                disabled={isCreating || !batchNames.trim()}
                                                style={{ width: '100%', padding: '10px', background: '#10b981', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                                            >
                                                {isCreating ? 'Criando...' : 'Importar Lista'}
                                            </button>
                                        </div>

                                        {createdPins.length > 0 && (
                                            <div style={{ marginTop: '20px', padding: '15px', background: '#fff', border: '2px solid #10b981', borderRadius: '8px' }}>
                                                <h4 style={{ color: '#10b981', marginTop: 0 }}>✅ Alunos criados! Guarde os acessos:</h4>
                                                <div style={{ background: '#f0fdf4', padding: '8px 12px', borderRadius: '6px', marginBottom: '10px', fontSize: '0.9rem' }}>
                                                    Código da turma: <code style={{ fontWeight: 800, letterSpacing: '1px' }}>{accessCode || '(veja no card da turma)'}</code>
                                                </div>
                                                <ul style={{ margin: 0, paddingLeft: '20px', maxHeight: '150px', overflowY: 'auto' }}>
                                                    {createdPins.map((cp, i) => (
                                                        <li key={i}><strong>{cp.name}</strong>: PIN <code>{cp.pin}</code></li>
                                                    ))}
                                                </ul>
                                                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '8px 0 10px' }}>
                                                    ⚠️ Os PINs não podem ser vistos depois (ficam protegidos). Copie ou imprima agora.
                                                </p>
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    <button onClick={copyPins} style={{ padding: '8px 14px', fontSize: '0.85rem', cursor: 'pointer', background: 'var(--color-blue)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700 }}>
                                                        📋 Copiar lista
                                                    </button>
                                                    <button onClick={printPins} style={{ padding: '8px 14px', fontSize: '0.85rem', cursor: 'pointer', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700 }}>
                                                        🖨️ Imprimir cartões
                                                    </button>
                                                    <button onClick={() => setCreatedPins([])} style={{ padding: '8px 14px', fontSize: '0.85rem', cursor: 'pointer', background: '#f1f5f9', border: 'none', borderRadius: '8px' }}>
                                                        Limpar
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ padding: '20px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <h3>Roster da Turma ({students.length})</h3>
                                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                            {students.length === 0 ? (
                                                <p style={{ color: '#94a3b8' }}>Nenhum aluno na turma.</p>
                                            ) : (
                                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                                    {students.map(s => (
                                                        <li key={s.id} style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                                                            <span>{s.name}</span>
                                                            {/* We can't show the PIN here because it's hashed in the DB, which is exactly what we want for security */}
                                                            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Cadastrado</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className={styles.footer}>
                    {activeTab === 'report' && (
                        <button className={styles.exportBtn} onClick={() => window.print()}>🖨️ Exportar Relatório PDF</button>
                    )}
                    <p>{students.length} campeões mapeados nesta turma.</p>
                </div>
            </div>

            {selectedStudent && (
                <StudentGraphModal
                    studentName={selectedStudent.name}
                    nodeMastery={selectedStudent.nodeMastery}
                    tabuadaMastery={selectedStudent.tabuadaMastery}
                    onClose={() => setSelectedStudent(null)}
                />
            )}
        </div>
    );
};
