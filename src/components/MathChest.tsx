import { useState } from 'react';
import styles from './MathChest.module.css';

interface MathChestProps {
    onOpen: (reward: number) => void;
}

export default function MathChest({ onOpen }: MathChestProps) {
    const [status, setStatus] = useState<'closed' | 'opening' | 'opened'>('closed');
    const [reward, setReward] = useState<number>(0);

    const handleOpen = () => {
        if (status !== 'closed') return;

        setStatus('opening');

        // Random reward between 20 and 100 stars
        const randomReward = Math.floor(Math.random() * 81) + 20;
        setReward(randomReward);

        setTimeout(() => {
            setStatus('opened');
            setTimeout(() => onOpen(randomReward), 2500);
        }, 1500);
    };

    return (
        <div className={styles.chestOverlay}>
            <div className={styles.container}>
                <h2 className={styles.title}>
                    {status === 'closed' ? 'Você ganhou um Baú Matemático!' :
                        status === 'opening' ? 'Abrindo...' : '¡Surpresa!'}
                </h2>

                <div
                    className={`${styles.chest} ${styles[status]}`}
                    onClick={handleOpen}
                >
                    {status === 'closed' && <div className={styles.glow}></div>}
                    <div className={styles.chestTop}></div>
                    <div className={styles.chestBottom}></div>

                    {status === 'opened' && (
                        <div className={styles.reward}>
                            <span className={styles.rewardIcon}>⭐</span>
                            <span className={styles.rewardValue}>+{reward}</span>
                        </div>
                    )}
                </div>

                {status === 'closed' && (
                    <p className={styles.instruction}>Clique no baú para abrir!</p>
                )}
            </div>
        </div>
    );
}
