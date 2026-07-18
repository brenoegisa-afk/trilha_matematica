import { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { triggerConfetti } from '../utils/confetti';
import styles from './CosmeticUnlockModal.module.css';

/**
 * Celebra um desbloqueio de customização (companheiro/aura) — a "recompensa
 * concreta no meio da partida" que a squad de game design recomendou
 * (ROADMAP §11.3): a cada N acertos, um item novo vira disponível pra
 * enfeitar o herói, sem esperar o fim da partida.
 */
export default function CosmeticUnlockModal() {
    const cosmeticUnlockData = useGame(state => state.cosmeticUnlockData);
    const clearCosmeticUnlock = useGame(state => state.clearCosmeticUnlock);

    useEffect(() => {
        if (cosmeticUnlockData) triggerConfetti();
    }, [cosmeticUnlockData]);

    if (!cosmeticUnlockData) return null;

    const { playerName, slotLabel, optionLabel, emoji } = cosmeticUnlockData;

    return (
        <div className={styles.overlay} onClick={clearCosmeticUnlock}>
            <div className={styles.card} onClick={e => e.stopPropagation()}>
                <div className={styles.badge}>{emoji}</div>
                <p className={styles.kicker}>Novo item desbloqueado!</p>
                <h2 className={styles.itemName}>{optionLabel}</h2>
                <p className={styles.player}>
                    {playerName} ganhou um(a) novo(a) <strong>{slotLabel.toLowerCase()}</strong> pra
                    personalizar o herói! 🎁
                </p>

                <button className={styles.button} onClick={clearCosmeticUnlock}>
                    Continuar jogando! 🚀
                </button>
            </div>
        </div>
    );
}
