import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';
import styles from './TeacherDashboard.module.css';
import { useNavigate } from 'react-router-dom';

export default function ParentDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                navigate('/login');
            } else {
                setUser(session.user);
            }
        });
    }, [navigate]);

    const { data: children, isLoading } = useQuery({
        queryKey: ['parent-profiles', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', user.id)
                .order('stars', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        enabled: !!user,
    });

    if (isLoading) return <div className={styles.loader}>Carregando campeões...</div>;

    return (
        <div className={styles.dashboardContainer} style={{ padding: '40px' }}>
            <div className={styles.welcomeSection}>
                <h1>Espaço dos Pais 👪</h1>
                <p>Acompanhe o brilho e a evolução dos seus campeões.</p>
                {user && <small style={{ opacity: 0.6 }}>Conectado como: {user.email}</small>}
            </div>

            <div className={styles.statsRow}>
                {children?.map((child: any) => (
                    <div key={child.id} className={styles.statCard} style={{ cursor: 'default', minWidth: '280px' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>{child.equipped_avatar || '👤'}</div>
                        <h2 style={{ margin: 0 }}>{child.name}</h2>
                        
                        {child.class_id && (
                            <span style={{ 
                                backgroundColor: 'var(--color-blue)', 
                                color: 'white', 
                                padding: '2px 8px', 
                                borderRadius: '10px', 
                                fontSize: '0.7rem',
                                marginTop: '5px',
                                display: 'inline-block'
                            }}>
                                Turma Vinculada 🏫
                            </span>
                        )}

                        <div style={{ marginTop: '15px', textAlign: 'left', width: '100%' }}>
                            <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Pontuação Total:</span>
                                <strong>{child.total_score || 0}</strong>
                            </div>
                            <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Estrelas:</span>
                                <strong>⭐ {child.stars || 0}</strong>
                            </div>
                            <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Nível:</span>
                                <strong>LV {child.level || 1}</strong>
                            </div>
                        </div>
                        <div style={{ marginTop: '20px', width: '100%', height: '10px', backgroundColor: '#eee', borderRadius: '5px' }}>
                            <div style={{ 
                                width: `${Math.min(100, (child.xp || 0) % 100)}%`, 
                                height: '100%', 
                                backgroundColor: 'var(--color-green)', 
                                borderRadius: '5px' 
                            }}></div>
                        </div>
                        <small style={{ marginTop: '5px', opacity: 0.7 }}>Progresso para o próximo nível</small>
                    </div>
                ))}
            </div>

            {(!children || children.length === 0) && (
                <div className={styles.emptyState}>
                    <p>Você ainda não tem perfis de filhos vinculados à sua conta.</p>
                    <button 
                        onClick={() => navigate('/setup')} 
                        className={styles.createBtn}
                        style={{ marginTop: '20px' }}
                    >
                        Vincular Perfil Agora
                    </button>
                </div>
            )}

            <div style={{ marginTop: '40px', background: 'white', padding: '20px', borderRadius: '12px', border: '2px solid #e5e5e5' }}>
                <h3>Dica Pedagógica do Dia 💡</h3>
                <p>"O erro é o primeiro passo para o grande acerto. Incentive seu filho a tentar novamente após uma resposta errada no jogo!"</p>
            </div>
        </div>
    );
}
