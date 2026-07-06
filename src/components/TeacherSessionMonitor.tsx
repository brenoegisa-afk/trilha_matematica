import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { BnccMap } from '../core/learning/BnccMap';
import styles from './TeacherSessionMonitor.module.css';
import { BatchImporter } from '../pages/BatchImporter';

interface Session {
    id: string;
    player_id: string;
    accuracy: number;
    total_questions: number;
    correct_answers: number;
    xp_gained: number;
    finished_at: string;
    skill_stats: Record<string, { attempts: number; successes: number }> | null;
}

interface PlayerProfile {
    id: string;
    name: string;
    total_score: number;
    stars: number;
    session_stats: Record<string, { attempts: number; successes: number }> | null;
}

const SKILL_NAMES: Record<string, string> = {
    'math_basic': 'Soma/Sub',
    'math_logic': 'Raciocínio',
    'math_expressions': 'Mult/Div',
    'math_fractions': 'Frações',
    'port_grammar': 'Gramática',
    'port_reading': 'Leitura',
    'sci_nature': 'Natureza',
    'sci_body': 'Corpo Humano'
};

function AccuracyBar({ value }: { value: number }) {
    const color = value >= 70 ? '#22c55e' : value >= 40 ? '#f59e0b' : '#ef4444';
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
                background: '#e2e8f0', borderRadius: 999, height: 10, flex: 1, overflow: 'hidden'
            }}>
                <div style={{
                    background: color, width: `${value}%`, height: '100%',
                    borderRadius: 999, transition: 'width 0.5s ease'
                }} />
            </div>
            <span style={{ fontWeight: 700, color, minWidth: 38, fontSize: '0.85rem' }}>{value}%</span>
        </div>
    );
}

function SkillTag({ skillId, stats }: { skillId: string; stats: { attempts: number; successes: number } }) {
    const acc = stats.attempts > 0 ? Math.round((stats.successes / stats.attempts) * 100) : 0;
    const color = acc >= 70 ? '#22c55e' : acc >= 40 ? '#f59e0b' : '#ef4444';
    const bnccCodes = BnccMap.getAllCodesForSkill(skillId);

    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: `${color}18`, border: `1.5px solid ${color}`,
            color, borderRadius: 8, padding: '2px 8px', fontSize: '0.78rem', fontWeight: 700
        }} title={bnccCodes ? `BNCC: ${bnccCodes}` : 'Sem mapeamento BNCC'}>
            {SKILL_NAMES[skillId] || skillId} {acc}%
            {bnccCodes && <span style={{ fontSize: '0.65rem', opacity: 0.8, marginLeft: 2 }}>[{bnccCodes.split(' / ')[0]}]</span>}
        </span>
    );
}

export default function TeacherSessionMonitor({ classId, className, onClose }: { classId: string; className?: string; onClose: () => void }) {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [playerMap, setPlayerMap] = useState<Record<string, string>>({});
    const [view, setView] = useState<'live' | 'students' | 'manage'>('live');
    const [liveIndicator, setLiveIndicator] = useState(false);

    // --- Manage state ---
    const [activeFocus, setActiveFocus] = useState<string | null>(null);
    const [savingFocus, setSavingFocus] = useState(false);
    const [customQuestions, setCustomQuestions] = useState<any[]>([]);
    const [showQForm, setShowQForm] = useState(false);
    const [qForm, setQForm] = useState({ question: '', optionA: '', optionB: '', optionC: '', optionD: '', answer: 'A', skillId: 'math_basic' });
    const [savingQ, setSavingQ] = useState(false);
    const [showBatchImporter, setShowBatchImporter] = useState(false);
    const [copied, setCopied] = useState(false);

    const generateAIPrompt = () => {
        const prompt = `Gere 10 problemas originais para a turma "${className || 'Alunos'}", focando em matérias do Ensino Fundamental.
O tema deve ser lúdico e envolvente.
Formato esperado (responda APENAS com a lista JSON neste formato exato):
[
  {"question": "Enunciado Curto", "answer": "OpçãoCerta", "options": ["Opção1", "Opção2", "OpçãoCerta", "Opção4"], "skill_id": "math_basic"}
]
Use um dos seguintes skill_id: math_basic, math_logic, math_expressions, math_fractions, port_grammar, port_reading, sci_nature, sci_body.`;

        navigator.clipboard.writeText(prompt).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        }).catch(() => alert("Erro ao copiar o prompt!"));
    };

    const fetchProfiles = useCallback(async () => {
        const { data } = await supabase
            .from('profiles')
            .select('id, name, total_score, stars, session_stats')
            .eq('class_id', classId)
            .order('total_score', { ascending: false });

        if (data) {
            setProfiles(data as PlayerProfile[]);
            const map: Record<string, string> = {};
            data.forEach((p: any) => { map[p.id] = p.name; });
            setPlayerMap(map);
        }
    }, [classId]);

    const fetchSessions = useCallback(async () => {
        const { data } = await supabase
            .from('game_sessions')
            .select('*')
            .eq('class_id', classId)
            .order('finished_at', { ascending: false })
            .limit(100);

        if (data) setSessions(data as Session[]);
    }, [classId]);

    const fetchClassInfo = useCallback(async () => {
        const { data } = await supabase
            .from('classes')
            .select('active_focus_skill')
            .eq('id', classId)
            .single();
        if (data) setActiveFocus(data.active_focus_skill);
    }, [classId]);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchProfiles(), fetchSessions(), fetchClassInfo(), fetchCustomQuestions()]);
            setLoading(false);
        };
        init();

        // Supabase Realtime — live session feed
        const channel = supabase
            .channel(`monitor-${classId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'game_sessions',
                filter: `class_id=eq.${classId}`
            }, () => {
                fetchSessions();
                fetchProfiles();
                setLiveIndicator(true);
                setTimeout(() => setLiveIndicator(false), 3000);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [classId, fetchSessions, fetchProfiles, fetchClassInfo]);

    // --- Save Focus ---
    const saveActiveFocus = async (skillId: string | null) => {
        setSavingFocus(true);
        const { error } = await supabase
            .from('classes')
            .update({ active_focus_skill: skillId })
            .eq('id', classId);
        if (!error) setActiveFocus(skillId);
        setSavingFocus(false);
    };

    // --- Custom Questions ---
    const fetchCustomQuestions = async () => {
        try {
            const { data } = await supabase
                .from('custom_questions')
                .select('*')
                .eq('class_id', classId)
                .order('created_at', { ascending: false });
            if (data) setCustomQuestions(data);
        } catch (e) {
            console.warn('custom_questions table not ready:', e);
        }
    };

    const saveCustomQuestion = async () => {
        setSavingQ(true);
        const options = JSON.stringify([qForm.optionA, qForm.optionB, qForm.optionC, qForm.optionD]);
        const answerMap: Record<string, string> = { A: qForm.optionA, B: qForm.optionB, C: qForm.optionC, D: qForm.optionD };
        const { error } = await supabase.from('custom_questions').insert({
            class_id: classId,
            question: qForm.question,
            answer: answerMap[qForm.answer],
            options,
            skill_id: qForm.skillId
        });
        if (!error) {
            setQForm({ question: '', optionA: '', optionB: '', optionC: '', optionD: '', answer: 'A', skillId: 'math_basic' });
            setShowQForm(false);
            fetchCustomQuestions();
        }
        setSavingQ(false);
    };

    const deleteCustomQuestion = async (id: string) => {
        await supabase.from('custom_questions').delete().eq('id', id);
        fetchCustomQuestions();
    };

    // --- Summary stats ---
    const totalSessions = sessions.length;
    const avgAccuracy = totalSessions > 0
        ? Math.round(sessions.reduce((s, x) => s + x.accuracy, 0) / totalSessions)
        : 0;
    const studentsWithHelp = profiles.filter(p => {
        if (!p.session_stats) return false;
        return Object.values(p.session_stats).some(
            s => s.attempts > 0 && (s.successes / s.attempts) < 0.4
        );
    }).length;

    // --- Exportação ---
    const exportToCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // BOM para acentuação no Excel
        csvContent += "Nome do Aluno,Pontuacao Total,Precisao Geral,Habilidades Praticadas\n";

        profiles.forEach(p => {
            let totalAttempts = 0;
            let totalSuccess = 0;
            let skillsInfo = "";

            if (p.session_stats) {
                Object.entries(p.session_stats).forEach(([skillId, stats]) => {
                    totalAttempts += stats.attempts;
                    totalSuccess += stats.successes;
                    const acc = stats.attempts > 0 ? Math.round((stats.successes / stats.attempts) * 100) : 0;
                    skillsInfo += `${SKILL_NAMES[skillId] || skillId}: ${acc}% | `;
                });
            }

            const generalAcc = totalAttempts > 0 ? Math.round((totalSuccess / totalAttempts) * 100) : 0;
            csvContent += `"${p.name}",${p.total_score},${generalAcc}%,"${skillsInfo}"\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "relatorio_turma.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                {/* Header */}
                <header className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <h2 style={{ margin: 0 }}>📊 Monitor da Turma</h2>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: liveIndicator ? '#22c55e' : '#f1f5f9',
                            color: liveIndicator ? 'white' : '#64748b',
                            padding: '3px 10px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 700,
                            transition: 'all 0.4s ease'
                        }}>
                            <span style={{
                                width: 8, height: 8, borderRadius: '50%',
                                background: liveIndicator ? 'white' : '#22c55e',
                                display: 'inline-block',
                                animation: 'pulse 2s infinite'
                            }} />
                            {liveIndicator ? 'Nova sessão!' : 'AO VIVO'}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={exportToCSV} className={styles.exportBtn} style={{
                            background: '#e2e8f0', color: '#334155', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                        }}>
                            📥 Exportar CSV
                        </button>
                        <button onClick={onClose} className={styles.closeBtn}>✕</button>
                    </div>
                </header>

                {/* Summary Cards */}
                {!loading && (
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 12, padding: '16px 20px', borderBottom: '1px solid #e2e8f0'
                    }}>
                        <div style={{ background: '#eff6ff', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#2563eb' }}>{totalSessions}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Partidas Registradas</div>
                        </div>
                        <div style={{ background: avgAccuracy >= 70 ? '#f0fdf4' : avgAccuracy >= 40 ? '#fffbeb' : '#fef2f2', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: avgAccuracy >= 70 ? '#16a34a' : avgAccuracy >= 40 ? '#d97706' : '#dc2626' }}>
                                {avgAccuracy}%
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Precisão Média</div>
                        </div>
                        <div style={{ background: studentsWithHelp > 0 ? '#fef2f2' : '#f0fdf4', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: studentsWithHelp > 0 ? '#dc2626' : '#16a34a' }}>
                                {studentsWithHelp > 0 ? `⚠️ ${studentsWithHelp}` : '✅ 0'}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Precisam de Atenção</div>
                        </div>
                    </div>
                )}

                {/* Tab Bar */}
                <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
                    {(['live', 'students', 'manage'] as const).map(tab => (
                        <button key={tab} onClick={() => setView(tab)} style={{
                            padding: '12px 20px', fontWeight: 700, cursor: 'pointer',
                            background: 'none', border: 'none',
                            borderBottom: view === tab ? '3px solid #2563eb' : '3px solid transparent',
                            color: view === tab ? '#2563eb' : '#64748b'
                        }}>
                            {tab === 'live' ? '⚡ Feed de Partidas' : tab === 'students' ? '👤 Diagnóstico por Aluno' : '⚙️ Gerenciar Aula'}
                        </button>
                    ))}
                </div>

                <div className={styles.content}>
                    {loading ? (
                        <div className={styles.loader} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                            ⏳ Carregando dados pedagógicos...
                        </div>
                    ) : view === 'live' ? (
                        /* === LIVE FEED === */
                        sessions.length === 0 ? (
                            <div className={styles.empty} style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
                                <div style={{ fontSize: '3rem' }}>📭</div>
                                <p style={{ fontWeight: 700 }}>Nenhuma partida registrada ainda.</p>
                                <p>Quando os alunos terminarem de jogar, as sessões aparecerão aqui automaticamente.</p>
                            </div>
                        ) : (
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Aluno</th>
                                            <th>Data/Hora</th>
                                            <th style={{ minWidth: 140 }}>Precisão</th>
                                            <th>Acertos</th>
                                            <th>XP</th>
                                            <th>Habilidades</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sessions.map(s => (
                                            <tr key={s.id}>
                                                <td className={styles.playerName}>
                                                    {playerMap[s.player_id] || '—'}
                                                </td>
                                                <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                    {new Date(s.finished_at).toLocaleString('pt-BR', {
                                                        day: '2-digit', month: '2-digit',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </td>
                                                <td>
                                                    <AccuracyBar value={s.accuracy} />
                                                </td>
                                                <td style={{ fontWeight: 700 }}>
                                                    {s.correct_answers}/{s.total_questions}
                                                </td>
                                                <td style={{ fontWeight: 700, color: '#7c3aed' }}>+{s.xp_gained}</td>
                                                <td className={styles.skills}>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                        {s.skill_stats
                                                            ? Object.entries(s.skill_stats).map(([id, stats]) => (
                                                                <SkillTag key={id} skillId={id} stats={stats} />
                                                            ))
                                                            : <span style={{ color: '#cbd5e1' }}>—</span>
                                                        }
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    ) : view === 'students' ? (
                        /* === STUDENT DIAGNOSIS === */
                        profiles.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
                                <div style={{ fontSize: '3rem' }}>👤</div>
                                <p style={{ fontWeight: 700 }}>Nenhum aluno cadastrado na turma.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {profiles.map(p => {
                                    const needsHelp = p.session_stats
                                        ? Object.values(p.session_stats).some(
                                            s => s.attempts > 0 && (s.successes / s.attempts) < 0.4
                                        )
                                        : false;
                                    const hasMastery = p.session_stats
                                        ? Object.values(p.session_stats).some(
                                            s => s.attempts > 0 && (s.successes / s.attempts) >= 0.8
                                        )
                                        : false;

                                    return (
                                        <div key={p.id} style={{
                                            background: needsHelp ? '#fff5f5' : '#fafafa',
                                            border: needsHelp ? '2px solid #fca5a5' : '1.5px solid #e2e8f0',
                                            borderRadius: 14, padding: '14px 18px',
                                            display: 'flex', flexDirection: 'column', gap: 10
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{
                                                        width: 38, height: 38, borderRadius: '50%',
                                                        background: needsHelp ? '#ef4444' : hasMastery ? '#22c55e' : '#94a3b8',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: 'white', fontWeight: 900, fontSize: '1rem'
                                                    }}>
                                                        {p.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 800, color: '#1e293b' }}>{p.name}</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                            {p.total_score} pts · ⭐ {p.stars}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '1.2rem' }}>
                                                    {needsHelp ? '⚠️ Precisa de Atenção' : hasMastery ? '🌟 Excelente!' : '📈 Em Progresso'}
                                                </div>
                                            </div>
                                            {p.session_stats && Object.keys(p.session_stats).length > 0 ? (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                    {Object.entries(p.session_stats).map(([id, stats]) => (
                                                        <SkillTag key={id} skillId={id} stats={stats} />
                                                    ))}
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                                                    Sem dados de sessão ainda. O aluno precisa completar uma partida.
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    ) : (
                        /* === MANAGE CLASS === */
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <h3 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>🎯 Foco da Aula</h3>
                                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>
                                    Travar as missões do jogo em uma habilidade específica. Quando ativado, os alunos receberão <b>apenas</b> desafios dessa matéria (ignorando a roleta normal).
                                </p>
                                
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <select 
                                        value={activeFocus || ''} 
                                        onChange={(e) => saveActiveFocus(e.target.value || null)}
                                        disabled={savingFocus}
                                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', flex: 1, fontWeight: 'bold' }}
                                    >
                                        <option value="">🎲 Padrão (Roleta Aleatória / Adaptativa)</option>
                                        {Object.entries(SKILL_NAMES).map(([id, name]) => (
                                            <option key={id} value={id}>
                                                {name} {BnccMap.getAllCodesForSkill(id) ? `[${BnccMap.getAllCodesForSkill(id)?.split(' / ')[0]}]` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {savingFocus && <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Salvando...</span>}
                                </div>
                                {activeFocus && (
                                    <div style={{ marginTop: '12px', padding: '10px', background: '#dcfce7', color: '#166534', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                        ✅ Foco Ativo! Próximas cartas serão de {SKILL_NAMES[activeFocus]}.
                                    </div>
                                )}
                            </div>

                            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <h3 style={{ margin: 0, color: '#1e293b' }}>📝 Questões Customizadas ({customQuestions.length})</h3>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={generateAIPrompt} style={{
                                            padding: '8px 16px', background: copied ? '#22c55e' : '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'
                                        }}>
                                            {copied ? '✅ Copiado!' : '🤖 Gerar Prompt IA'}
                                        </button>
                                        <button onClick={() => setShowBatchImporter(!showBatchImporter)} style={{
                                            padding: '8px 16px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'
                                        }}>
                                            {showBatchImporter ? '✕ Fechar' : '📥 Importar Lote'}
                                        </button>
                                        <button onClick={() => setShowQForm(!showQForm)} style={{
                                            padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'
                                        }}>
                                            {showQForm ? '✕ Cancelar' : '+ Nova Questão'}
                                        </button>
                                    </div>
                                </div>
                                
                                {showBatchImporter && (
                                    <div style={{ marginBottom: '16px', background: 'white', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                        <BatchImporter classId={classId} onClose={() => { setShowBatchImporter(false); fetchCustomQuestions(); }} />
                                    </div>
                                )}

                                {showQForm && (
                                    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <input placeholder="Pergunta (ex: Quanto é 3 x 7?)" value={qForm.question} onChange={e => setQForm({...qForm, question: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 'bold' }} />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                            <input placeholder="Alternativa A" value={qForm.optionA} onChange={e => setQForm({...qForm, optionA: e.target.value})} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                                            <input placeholder="Alternativa B" value={qForm.optionB} onChange={e => setQForm({...qForm, optionB: e.target.value})} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                                            <input placeholder="Alternativa C" value={qForm.optionC} onChange={e => setQForm({...qForm, optionC: e.target.value})} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                                            <input placeholder="Alternativa D" value={qForm.optionD} onChange={e => setQForm({...qForm, optionD: e.target.value})} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#334155' }}>Resposta certa:</label>
                                            {['A', 'B', 'C', 'D'].map(letter => (
                                                <label key={letter} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                                    <input type="radio" name="answer" value={letter} checked={qForm.answer === letter} onChange={() => setQForm({...qForm, answer: letter})} />
                                                    {letter}
                                                </label>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#334155' }}>Habilidade:</label>
                                            <select value={qForm.skillId} onChange={e => setQForm({...qForm, skillId: e.target.value})} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                                {Object.entries(SKILL_NAMES).map(([id, name]) => (
                                                    <option key={id} value={id}>{name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <button onClick={saveCustomQuestion} disabled={savingQ || !qForm.question || !qForm.optionA || !qForm.optionB} style={{
                                            padding: '10px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', opacity: (savingQ || !qForm.question) ? 0.5 : 1
                                        }}>
                                            {savingQ ? 'Salvando...' : '✅ Salvar Questão'}
                                        </button>
                                    </div>
                                )}

                                {customQuestions.length === 0 ? (
                                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
                                        Nenhuma questão customizada ainda. Clique em "+ Nova Questão" para criar!
                                    </p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                                        {customQuestions.map(q => (
                                            <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                <div>
                                                    <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '0.9rem' }}>{q.question}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                        {SKILL_NAMES[q.skill_id] || q.skill_id} · Resposta: {q.answer}
                                                    </div>
                                                </div>
                                                <button onClick={() => deleteCustomQuestion(q.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#ef4444' }} title="Excluir">
                                                    🗑️
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
