import { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { triggerConfetti } from '../utils/confetti';
import styles from './NodeUnlockModal.module.css';

/**
 * Celebra o domínio de um nó do grafo curricular — o momento em que a criança
 * "sobe de verdade" na trilha (não pela sorte do dado, mas por aprendizado).
 */
export default function NodeUnlockModal() {
    const nodeUnlockData = useGame(state => state.nodeUnlockData);
    const clearNodeUnlock = useGame(state => state.clearNodeUnlock);

    useEffect(() => {
        if (nodeUnlockData) triggerConfetti();
    }, [nodeUnlockData]);

    if (!nodeUnlockData) return null;

    const { playerName, nodeName, nodeIcon, nextNodeName } = nodeUnlockData;

    return (
        <div className={styles.overlay} onClick={clearNodeUnlock}>
            <div className={styles.card} onClick={e => e.stopPropagation()}>
                <div className={styles.badge}>{nodeIcon}</div>
                <p className={styles.kicker}>Habilidade dominada!</p>
                <h2 className={styles.nodeName}>{nodeName}</h2>
                <p className={styles.player}>Mandou bem, {playerName}! 🎉</p>

                {nextNodeName && (
                    <div className={styles.next}>
                        <span>Novo caminho aberto</span>
                        {nextNodeName}
                    </div>
                )}

                <button className={styles.button} onClick={clearNodeUnlock}>
                    Continuar a aventura! 🚀
                </button>
            </div>
        </div>
    );
}
