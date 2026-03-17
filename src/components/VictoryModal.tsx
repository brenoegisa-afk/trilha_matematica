import { useGame } from '../context/GameContext';
import styles from './VictoryModal.module.css';
import { useEffect } from 'react';
import { triggerConfetti } from '../utils/confetti';

export default function VictoryModal() {
    const { gameState, actions } = useGame();
    const { waitingVictory } = gameState;

    useEffect(() => {
        if (waitingVictory) {
            triggerConfetti();
        }
    }, [waitingVictory]);

    if (!waitingVictory) return null;

    const { player, mascot } = waitingVictory;

    return (
        <div className={styles.victoryOverlay}>
            <div className={styles.victoryContainer}>
                <div className={styles.rays} />
                
                <h1 className={styles.title}>Novo Mascote!</h1>
                
                <div className={styles.mascotCircle}>
                    {mascot.icon}
                </div>
                
                <p className={styles.subtitle}>
                    {player.name} encontrou o:
                    <span className={styles.mascotName}>{mascot.name}</span>
                </p>

                <div style={{ 
                    background: '#f1f2f6', 
                    padding: '15px', 
                    borderRadius: '15px', 
                    marginBottom: '30px',
                    fontSize: '1rem',
                    color: '#2f3542'
                }}>
                    <strong>Bônus:</strong> {mascot.buff.type === 'xp_boost' ? 'Mais XP nas partidas!' : mascot.buff.type === 'protection' ? 'Proteção contra recuos!' : 'Mais dano nos vilões!'}
                </div>

                <button 
                    className={styles.continueButton}
                    onClick={() => actions.acknowledgeVictory()}
                >
                    Incrível! Continuar
                </button>
            </div>
        </div>
    );
}
