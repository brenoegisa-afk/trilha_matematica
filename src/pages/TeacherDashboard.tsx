import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import styles from './TeacherDashboard.module.css';
import QuizEditor from './QuizEditor';
import { StudentManager } from './StudentManager';


interface ClassData {
    id: string;
    name: string;
    access_code: string;
    created_at: string;
}

export default function TeacherDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [loading, setLoading] = useState(true);
    const [newClassName, setNewClassName] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeQuizClass, setActiveQuizClass] = useState<ClassData | null>(null);
    const [activeStudentClass, setActiveStudentClass] = useState<ClassData | null>(null);
    const [classStats, setClassStats] = useState<Record<string, { studentCount: number, questionCount: number }>>({});



    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/teacher/login');
                return;
            }
            setUser(session.user);
            fetchClasses(session.user.id);
        };

        checkUser();
    }, [navigate]);

    const fetchClasses = async (userId: string) => {
        setLoading(true);
        const { data, error } = await supabase
            .from('classes')
            .select('*')
            .eq('teacher_id', userId)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setClasses(data);
            fetchStats(data);
        }
        setLoading(false);
    };

    const fetchStats = async (classesList: ClassData[]) => {
        const stats: Record<string, { studentCount: number, questionCount: number }> = {};

        for (const c of classesList) {
            // Get student count
            const { count: sCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('class_id', c.id);

            // Get question count
            const { count: qCount } = await supabase
                .from('teacher_questions')
                .select('*', { count: 'exact', head: true })
                .eq('class_id', c.id);

            stats[c.id] = {
                studentCount: sCount || 0,
                questionCount: qCount || 0
            };
        }
        setClassStats(stats);
    };


    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClassName.trim() || !user) return;

        // Generate a 6-character random access code
        const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const { data, error } = await supabase
            .from('classes')
            .insert([
                { name: newClassName, teacher_id: user.id, access_code: accessCode }
            ])
            .select();

        if (!error && data) {
            setClasses([data[0], ...classes]);
            setNewClassName('');
            setShowCreateModal(false);
        } else {
            alert('Erro ao criar turma: ' + error?.message);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    if (loading && !user) return <div className={styles.loader}>Carregando...</div>;

    return (
        <div className={styles.dashboardContainer}>
            <header className={styles.header}>
                <div className={styles.logo}>
                    <span onClick={() => navigate('/')}>🏫 Painel do Professor</span>
                </div>
                <div className={styles.userMenu}>
                    <span>{user?.email}</span>
                    <button onClick={handleLogout} className={styles.logoutBtn}>Sair</button>
                </div>
            </header>

            <main className={styles.mainContent}>
                <div className={styles.welcomeSection}>
                    <h1>Bem-vindo, Professor!</h1>
                    <p>Gerencie suas turmas e acompanhe o aprendizado dos seus pequenos campeões.</p>
                </div>

                <div className={styles.actionsBar}>
                    <h2>Suas Turmas</h2>
                    <button onClick={() => setShowCreateModal(true)} className={styles.createBtn}>
                        + Criar Nova Turma
                    </button>
                </div>

                {classes.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>Você ainda não tem turmas cadastradas.</p>
                        <button onClick={() => setShowCreateModal(true)}>Clique aqui para começar!</button>
                    </div>
                ) : (
                    <div className={styles.classList}>
                        {classes.map(c => (
                            <div key={c.id} className={styles.classCard}>
                                <div className={styles.classHeader}>
                                    <h3>{c.name}</h3>
                                    <span className={styles.date}>{new Date(c.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className={styles.classBody}>
                                    <div className={styles.accessCode}>
                                        <label>Código de Acesso:</label>
                                        <code>{c.access_code}</code>
                                    </div>
                                    <div className={styles.stats}>
                                        <span>👥 {classStats[c.id]?.studentCount || 0} Alunos</span>
                                        <span className={classStats[c.id]?.questionCount >= 10 ? styles.totalFocus : styles.incomplete}>
                                            {classStats[c.id]?.questionCount >= 10 ? '🔥 Total Foco' : `📝 ${classStats[c.id]?.questionCount || 0}/10 Perguntas`}
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.classFooter}>
                                    <button
                                        className={styles.manageBtn}
                                        onClick={() => setActiveStudentClass(c)}
                                    >
                                        Gerenciar Alunos
                                    </button>

                                    <button
                                        className={styles.quizBtn}
                                        onClick={() => setActiveQuizClass(c)}
                                    >
                                        Criar Perguntas
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {activeQuizClass && (
                <QuizEditor
                    classId={activeQuizClass.id}
                    className={activeQuizClass.name}
                    onClose={() => {
                        setActiveQuizClass(null);
                        fetchClasses(user.id); // Refresh stats
                    }}
                />
            )}

            {activeStudentClass && (
                <StudentManager
                    classId={activeStudentClass.id}
                    className={activeStudentClass.name}
                    onClose={() => setActiveStudentClass(null)}
                />
            )}


            {showCreateModal && (

                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>Criar Nova Turma</h3>
                        <form onSubmit={handleCreateClass}>
                            <input
                                type="text"
                                placeholder="Nome da Turma (Ex: 3º Ano B)"
                                value={newClassName}
                                onChange={(e) => setNewClassName(e.target.value)}
                                required
                                autoFocus
                            />
                            <div className={styles.modalBtns}>
                                <button type="button" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                                <button type="submit" className={styles.confirmBtn}>Criar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
