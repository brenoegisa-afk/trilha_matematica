import { useState, useEffect } from 'react';
import styles from './LevelUpModal.module.css';

interface LevelUpModalProps {
    playerName: string;
    oldLevel: number;
    newLevel: number;
    onClose: () => void;
}

export default function LevelUpModal({ playerName, oldLevel, newLevel, onClose }: LevelUpModalProps) {
    const [showStars, setShowStars] = useState(false);

    useEffect(() => {
        // Delay stars for dramatic effect
        const timer = setTimeout(() => setShowStars(true), 500);
        return () => clearTimeout(timer);
    }, []);

    // Generate random star positions
    const starPositions = Array.from({ length: 12 }, (_, i) => ({
        left: `${Math.random() * 90 + 5}%`,
        top: `${Math.random() * 90 + 5}%`,
        delay: `${i * 0.15}s`,
        emoji: ['⭐', '✨', '💫', '🌟'][i % 4]
    }));

    return (
        <div className={styles.overlay} onClick={onClose}>
            {/* Spinning sunburst */}
            <div className={styles.sunburst} />

            {/* Twinkling stars */}
            {showStars && (
                <div className={styles.stars}>
                    {starPositions.map((star, idx) => (
                        <span 
                            key={idx} 
                            className={styles.star}
                            style={{ 
                                left: star.left, 
                                top: star.top,
                                animationDelay: star.delay
                            }}
                        >
                            {star.emoji}
                        </span>
                    ))}
                </div>
            )}

            {/* Main card */}
            <div className={styles.card} onClick={e => e.stopPropagation()}>
                <div className={styles.medalIcon}>🏅</div>
                
                <h2 className={styles.title}>NÍVEL ACIMA!</h2>
                <p className={styles.subtitle}>{playerName} evoluiu!</p>

                <div className={styles.levelDisplay}>
                    <span className={styles.oldLevel}>{oldLevel}</span>
                    <span className={styles.arrow}>➡️</span>
                    <span className={styles.newLevel}>{newLevel}</span>
                </div>

                <button className={styles.continueBtn} onClick={onClose}>
                    INCRÍVEL! 🎉
                </button>
            </div>
        </div>
    );
}
