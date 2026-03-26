import { useGame } from '../context/GameContext';
import styles from './VictoryModal.module.css';
import { useEffect } from 'react';
import { triggerConfetti } from '../utils/confetti';
import { MascotEngine } from '../core/game/MascotEngine';

const mascotEngine = new MascotEngine();

export default function VictoryModal() {
    const { waitingVictory, actions } = useGame();

    useEffect(() => {
        if (waitingVictory) {
            triggerConfetti();
        }
    }, [waitingVictory]);

    if (!waitingVictory) return null;

    const { player, mascot } = waitingVictory;
    const archetype = (mascotEngine as any).archetypes.find((a: any) => a.id === mascot.id);

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: '🏆 Nova Conquista na Trilha!',
                text: `${player.name} acaba de ganhar o mascote ${mascot.name} na Trilha dos Campeões! 🚀`,
                url: window.location.origin
            }).catch(console.error);
        } else {
            alert('Compartilhamento não disponível neste navegador.');
        }
    };

    return (
        <div className={styles.victoryOverlay}>
            <div className={styles.victoryContainer}>
                <div className={styles.rays} />
                
                <h1 className={styles.title}>🎉 Vitória!</h1>
                
                <div className={styles.mascotCircle}>
                    {mascot.icon}
                </div>
                
                <p className={styles.subtitle}>
                    {player.name} conquistou o:
                    <span className={styles.mascotName}>{mascot.name}</span>
                </p>

                {archetype && (
                    <div className={styles.buffBox}>
                        <strong>Bônus Ativo:</strong> {archetype.stats.description}
                    </div>
                )}

                <div className={styles.buttonGroup}>
                    <button 
                        className={styles.continueButton}
                        onClick={() => actions.acknowledgeVictory()}
                    >
                        Continuar
                    </button>
                    
                    <button 
                        className={styles.shareButton} 
                        onClick={handleShare}
                    >
                        📤 Compartilhar
                    </button>
                </div>
            </div>
        </div>
    );
}
