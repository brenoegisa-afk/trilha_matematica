import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import styles from './StudentManager.module.css';

interface StudentProfile {
    id: string;
    name: string;
    score: number;
    stars: number;
    streak: number;
    last_played: string;
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
                .select('id, name, total_score, stars, streak, last_sync')
                .eq('class_id', classId)
                .order('total_score', { ascending: false });

            if (error) throw error;

            const mapped: StudentProfile[] = (data || []).map(p => ({
                id: p.id,
                name: p.name,
                score: p.total_score || 0,
                stars: p.stars || 0,
                streak: p.streak || 0,
                last_played: p.last_sync || new Date().toISOString()
            }));


            setStudents(mapped);

        } catch (err) {
            console.error('Erro ao buscar alunos:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>Gerenciar Alunos: {className}</h2>
                    <button className={styles.closeBtn} onClick={onClose}>&times;</button>
                </div>

                <div className={styles.content}>
                    {loading ? (
                        <div className={styles.loading}>Carregando alunos...</div>
                    ) : students.length === 0 ? (
                        <div className={styles.empty}>Nenhum aluno vinculado a esta turma ainda.</div>
                    ) : (
                        <table className={styles.studentTable}>
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Pontos</th>
                                    <th>Estrelas</th>
                                    <th>Sequência (🔥)</th>
                                    <th>Última Partida</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(student => (
                                    <tr key={student.id}>
                                        <td className={styles.nameCell}>{student.name}</td>
                                        <td>{student.score}</td>
                                        <td>⭐ {student.stars}</td>
                                        <td>{student.streak >= 3 ? `🔥 ${student.streak}` : student.streak}</td>
                                        <td>{new Date(student.last_played).toLocaleDateString('pt-BR')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className={styles.footer}>
                    <p>{students.length} aluno(s) encontrados.</p>
                </div>
            </div>
        </div>
    );
};
