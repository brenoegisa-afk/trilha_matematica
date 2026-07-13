import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import styles from './TeacherDashboard.module.css';
import { StudentManager } from './StudentManager';
import TeacherSessionMonitor from '../components/TeacherSessionMonitor';


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
    const [activeStudentClass, setActiveStudentClass] = useState<ClassData | null>(null);
    const [activeMonitorClass, setActiveMonitorClass] = useState<ClassData | null>(null);
    const [classStats, setClassStats] = useState<Record<string, { studentCount: number, questionCount: number }>>({});

    // V2 Modal States
    const [classToDelete, setClassToDelete] = useState<ClassData | null>(null);
    const [classToRename, setClassToRename] = useState<ClassData | null>(null);
    const [renameValue, setRenameValue] = useState('');



    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            // Sessão anônima (aluno) NÃO é professor — exige conta de verdade.
            if (!session || session.user.is_anonymous) {
                navigate('/login');
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
        
        if (classesList.length === 0) {
            setClassStats(stats);
            return;
        }

        const classIds = classesList.map(c => c.id);

        try {
            // Fetch all profiles for these classes in one go
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('class_id')
                .in('class_id', classIds);

            // Fetch all questions for these classes in one go
            const { data: questionsData } = await supabase
                .from('custom_questions')
                .select('class_id')
                .in('class_id', classIds);

            // Initialize stats
            classesList.forEach(c => {
                stats[c.id] = { studentCount: 0, questionCount: 0 };
            });

            // Count profiles per class
            if (profilesData) {
                profilesData.forEach((p: any) => {
                    if (p.class_id && stats[p.class_id]) {
                        stats[p.class_id].studentCount++;
                    }
                });
            }

            // Count questions per class
            if (questionsData) {
                questionsData.forEach((q: any) => {
                    if (q.class_id && stats[q.class_id]) {
                        stats[q.class_id].questionCount++;
                    }
                });
            }

            setClassStats(stats);
        } catch (error) {
            console.error("Error fetching class stats", error);
        }
    };

    // V2: Summary Stats
    const totalStudents = Object.values(classStats).reduce((acc, curr) => acc + curr.studentCount, 0);
    const totalQuestions = Object.values(classStats).reduce((acc, curr) => acc + curr.questionCount, 0);


    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClassName.trim() || !user) return;

        // Generate a 6-character random access code (clean alphabet, no 0/O/1/I)
        const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let accessCode = '';
        for (let i = 0; i < 6; i++) {
            accessCode += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
        }

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

    // V2: Delete Class
    const handleDeleteClass = async () => {
        if (!classToDelete) return;

        const { error } = await supabase
            .from('classes')
            .delete()
            .eq('id', classToDelete.id);

        if (!error) {
            setClasses(classes.filter(c => c.id !== classToDelete.id));
            setClassToDelete(null);
        } else {
            alert('Erro ao deletar turma: ' + error.message);
        }
    };

    // V2: Rename Class
    const handleRenameClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!classToRename || !renameValue.trim()) return;

        const { error } = await supabase
            .from('classes')
            .update({ name: renameValue })
            .eq('id', classToRename.id);

        if (!error) {
            setClasses(classes.map(c => c.id === classToRename.id ? { ...c, name: renameValue } : c));
            setClassToRename(null);
            setRenameValue('');
        } else {
            alert('Erro ao renomear turma: ' + error.message);
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
                    <div style={{
                        display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px',
                        fontSize: '0.9rem', color: 'var(--color-ink)'
                    }}>
                        <span style={{ background: '#eff6ff', padding: '6px 12px', borderRadius: '20px', fontWeight: 700 }}>1️⃣ Crie uma turma</span>
                        <span style={{ background: '#eff6ff', padding: '6px 12px', borderRadius: '20px', fontWeight: 700 }}>2️⃣ Adicione os alunos (gera os PINs)</span>
                        <span style={{ background: '#eff6ff', padding: '6px 12px', borderRadius: '20px', fontWeight: 700 }}>3️⃣ Entregue o código da turma + o PIN pra cada um</span>
                    </div>
                </div>

                {/* V2: Summary Stats Row */}
                <div className={styles.statsRow}>
                    <div className={styles.statCard}>
                        <label>Turmas Ativas</label>
                        <div className={styles.statValue}>{classes.length}</div>
                    </div>
                    <div className={styles.statCard}>
                        <label>Total de Alunos</label>
                        <div className={styles.statValue}>👥 {totalStudents}</div>
                    </div>
                    <div className={styles.statCard}>
                        <label>Questões no Banco</label>
                        <div className={styles.statValue}>📝 {totalQuestions}</div>
                    </div>
                    {/* NEW: Global Weekly Engagement Placeholder/Calc */}
                    <div className={`${styles.statCard} ${styles.wideCard}`}>
                        <label>Engajamento Semanal (Média)</label>
                        <div className={styles.chartPlaceholder}>
                            <div className={styles.chartBar} style={{ height: '40%' }}></div>
                            <div className={styles.chartBar} style={{ height: '70%' }}></div>
                            <div className={styles.chartBar} style={{ height: '90%' }}></div>
                            <div className={styles.chartBar} style={{ height: '60%' }}></div>
                            <div className={styles.chartBar} style={{ height: '85%' }}></div>
                        </div>
                        <small>Atividade crescente nos últimos 5 dias 📈</small>
                    </div>
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
                                    <div>
                                        <div className={styles.classTypeBadge}>Turma Digital</div>
                                        <h3>{c.name}</h3>
                                        <span className={styles.date}>{new Date(c.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className={styles.cardActions}>
                                        <button
                                            className={styles.actionIconBtn}
                                            title="Renomear"
                                            onClick={() => { setClassToRename(c); setRenameValue(c.name); }}
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            className={styles.actionIconBtn}
                                            title="Excluir"
                                            onClick={() => setClassToDelete(c)}
                                        >
                                            🗑️
                                        </button>
                                    </div>
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
                                        className={styles.monitorBtn}
                                        onClick={() => setActiveMonitorClass(c)}
                                        style={{ backgroundColor: 'var(--color-yellow)', color: 'var(--color-ink)' }}
                                    >
                                        📊 Ver Atividade
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* V2: Delete Confirmation Modal */}
            {classToDelete && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal} style={{ borderColor: 'var(--color-red)' }}>
                        <h3 style={{ color: 'var(--color-red)' }}>Excluir Turma?</h3>
                        <p>Você tem certeza que deseja excluir a turma <strong>{classToDelete.name}</strong>? Esta ação não pode ser desfeita.</p>
                        <div className={styles.modalBtns}>
                            <button type="button" onClick={() => setClassToDelete(null)}>Cancelar</button>
                            <button
                                type="button"
                                className={styles.confirmBtn}
                                style={{ backgroundColor: 'var(--color-red)', color: 'white' }}
                                onClick={handleDeleteClass}
                            >
                                Sim, Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* V2: Rename Modal */}
            {classToRename && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>Renomear Turma</h3>
                        <form onSubmit={handleRenameClass}>
                            <input
                                type="text"
                                placeholder="Novo nome da turma"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                required
                                autoFocus
                            />
                            <div className={styles.modalBtns}>
                                <button type="button" onClick={() => setClassToRename(null)}>Cancelar</button>
                                <button type="submit" className={styles.confirmBtn}>Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {activeStudentClass && (
                <StudentManager
                    classId={activeStudentClass.id}
                    className={activeStudentClass.name}
                    accessCode={activeStudentClass.access_code}
                    onClose={() => setActiveStudentClass(null)}
                />
            )}

            {activeMonitorClass && (
                <TeacherSessionMonitor
                    classId={activeMonitorClass.id}
                    className={activeMonitorClass.name}
                    onClose={() => setActiveMonitorClass(null)}
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
