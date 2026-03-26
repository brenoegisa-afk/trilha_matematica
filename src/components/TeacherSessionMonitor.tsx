import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import styles from './TeacherSessionMonitor.module.css';

interface Session {
    id: string;
    player_id: string;
    accuracy: number;
    total_questions: number;
    correct_answers: number;
    xp_gained: number;
    finished_at: string;
    skill_stats: any;
}

export default function TeacherSessionMonitor({ classId, onClose }: { classId: string, onClose: () => void }) {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [players, setPlayers] = useState<Record<string, string>>({}); // id -> name

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            
            // Fetch sessions for this class
            const { data: sessionData, error: sessionError } = await supabase
                .from('game_sessions')
                .select('*')
                .eq('class_id', classId)
                .order('finished_at', { ascending: false })
                .limit(50);

            // Fetch player names for this class to map IDs to names
            const { data: profileData } = await supabase
                .from('profiles')
                .select('id, name')
                .eq('class_id', classId);

            if (profileData) {
                const mapping: Record<string, string> = {};
                profileData.forEach((p: any) => mapping[p.id] = p.name);
                setPlayers(mapping);
            }

            if (!sessionError && sessionData) {
                setSessions(sessionData);
            }
            setLoading(false);
        };

        fetchData();
    }, [classId]);

    const getSkillSummary = (skillStats: any) => {
        if (!skillStats) return 'N/A';
        return Object.entries(skillStats)
            .map(([id, stats]: [string, any]) => `${id.split('_').pop()}: ${Math.round((stats.successes / stats.attempts) * 100)}%`)
            .join(' | ');
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <header className={styles.header}>
                    <h2>📊 Atividade da Turma</h2>
                    <button onClick={onClose} className={styles.closeBtn}>✕</button>
                </header>

                <div className={styles.content}>
                    {loading ? (
                        <div className={styles.loader}>Buscando dados pedagógicos...</div>
                    ) : sessions.length === 0 ? (
                        <div className={styles.empty}>Ainda não há partidas registradas para esta turma.</div>
                    ) : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Aluno</th>
                                    <th>Data</th>
                                    <th>Precisão</th>
                                    <th>Acertos</th>
                                    <th>XP</th>
                                    <th>Habilidades (Sucesso %)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sessions.map(s => (
                                    <tr key={s.id}>
                                        <td className={styles.playerName}>{players[s.player_id] || 'Herói Desconhecido'}</td>
                                        <td>{new Date(s.finished_at).toLocaleString()}</td>
                                        <td>
                                            <span className={styles.accuracyBadge} style={{ 
                                                backgroundColor: s.accuracy > 70 ? '#22c55e' : s.accuracy > 40 ? '#f59e0b' : '#ef4444' 
                                            }}>
                                                {s.accuracy}%
                                            </span>
                                        </td>
                                        <td>{s.correct_answers}/{s.total_questions}</td>
                                        <td>+{s.xp_gained}</td>
                                        <td className={styles.skills}>{getSkillSummary(s.skill_stats)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
