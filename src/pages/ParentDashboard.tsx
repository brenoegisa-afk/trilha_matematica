import { useState, useEffect } from 'react';
import { getSavedProfiles } from '../utils/saveSystem';
import styles from './TeacherDashboard.module.css'; // Reusing styles for consistency or mapping to a new one

export default function ParentDashboard() {
    const [children, setChildren] = useState<any[]>([]);

    useEffect(() => {
        const profiles = getSavedProfiles();
        setChildren(profiles);
    }, []);

    return (
        <div className={styles.dashboardContainer} style={{ padding: '40px' }}>
            <div className={styles.welcomeSection}>
                <h1>Espaço dos Pais 👪</h1>
                <p>Acompanhe o brilho e a evolução dos seus campeões.</p>
            </div>

            <div className={styles.statsRow}>
                {children.map(child => (
                    <div key={child.id} className={styles.statCard} style={{ cursor: 'default' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>{child.avatar}</div>
                        <h2 style={{ margin: 0 }}>{child.name}</h2>
                        <div style={{ marginTop: '15px', textAlign: 'left', width: '100%' }}>
                            <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Pontuação Total:</span>
                                <strong>{child.totalScore || 0}</strong>
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
                                width: `${Math.min(100, (child.xp % 100))}%`, 
                                height: '100%', 
                                backgroundColor: 'var(--color-green)', 
                                borderRadius: '5px' 
                            }}></div>
                        </div>
                        <small style={{ marginTop: '5px', opacity: 0.7 }}>Progresso para o próximo nível</small>
                    </div>
                ))}
            </div>

            {children.length === 0 && (
                <div className={styles.emptyState}>
                    <p>Nenhum perfil de aluno encontrado neste dispositivo.</p>
                    <p>Peça ao seu filho para criar um perfil e começar a jogar!</p>
                </div>
            )}

            <div style={{ marginTop: '40px', background: 'white', padding: '20px', borderRadius: '12px', border: '2px solid #e5e5e5' }}>
                <h3>Dica Pedagógica do Dia 💡</h3>
                <p>"O erro é o primeiro passo para o grande acerto. Incentive seu filho a tentar novamente após uma resposta errada no jogo!"</p>
            </div>
        </div>
    );
}
