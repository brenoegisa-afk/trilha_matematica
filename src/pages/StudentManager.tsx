import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { DiagnosticService } from '../core/learning/DiagnosticService';
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
}

interface StudentManagerProps {
    classId: string;
    className: string;
    onClose: () => void;
}

export const StudentManager: React.FC<StudentManagerProps> = ({ classId, className, onClose }) => {
    const [students, setStudents] = useState<StudentProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStudents();
    }, [classId]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, total_score, stars, streak, last_sync, session_stats')
                .eq('class_id', classId)
                .order('total_score', { ascending: false });

            if (error) throw error;

            const mapped: StudentProfile[] = (data || []).map(p => {
                const mockPlayer = { sessionStats: p.session_stats, skillsMastery: [] } as any;
                const insights = DiagnosticService.generateReport(mockPlayer);
                const hasAlert = insights.some((i: any) => i.status === 'needs_help');
                const bestSkill = insights.find((i: any) => i.status === 'mastered')?.skillName;

                return {
                    id: p.id,
                    name: p.name,
                    score: p.total_score || 0,
                    stars: p.stars || 0,
                    streak: p.streak || 0,
                    last_played: p.last_sync || new Date().toISOString(),
                    hasAlert,
                    bestSkill
                };
            });

            setStudents(mapped);
        } catch (err) {
            console.error('Erro ao buscar alunos:', err);
        } finally {
            setLoading(false);
        }
    };

    // --- Analytics Calculations ---
    const totalStars = students.reduce((acc, s) => acc + s.stars, 0);
    const avgScore = students.length > 0 ? Math.round(students.reduce((acc, s) => acc + s.score, 0) / students.length) : 0;
    const activeToday = students.filter(s => {
        const d = new Date(s.last_played);
        const today = new Date();
        return d.toDateString() === today.toDateString();
    }).length;

    // Simple Attendance Mock/Calc based on last_played for the last 5 days
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
            <div className={styles.modal}>
                <div className={styles.header}>
                    <div className={styles.headerTitle}>
                        <span className={styles.badge}>B2B Premium</span>
                        <h2>Relatório Consolidado: {className}</h2>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>&times;</button>
                </div>

                <div className={styles.content}>
                    {loading ? (
                        <div className={styles.loading}>Carregando inteligência pedagógica...</div>
                    ) : (
                        <>
                            {/* NEW: Analytics Summary Row */}
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
                                <div className={styles.empty}>Nenhum aluno vinculado a esta turma ainda.</div>
                            ) : (
                                <>
                                    <h3 className={styles.sectionTitle}>Ranking de Performance</h3>
                                    <table className={styles.studentTable}>
                                        <thead>
                                            <tr>
                                                <th>Nome do Aluno</th>
                                                <th>Pontos</th>
                                                <th>Estrelas</th>
                                                <th>Foco (🔥)</th>
                                                <th>Diagnóstico Pedagógico</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {students.map((student, idx) => (
                                                <tr key={student.id} className={idx === 0 ? styles.topStudent : ''}>
                                                    <td className={styles.nameCell}>
                                                        {idx === 0 && <span className={styles.crown}>👑</span>}
                                                        {student.name}
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
                </div>

                <div className={styles.footer}>
                    <button className={styles.exportBtn} onClick={() => window.print()}>🖨️ Exportar Relatório PDF</button>
                    <p>{students.length} campeões mapeados nesta turma.</p>
                </div>
            </div>
        </div>
    );
};

