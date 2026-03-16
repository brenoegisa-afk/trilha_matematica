import { useGame } from '../context/GameContext';
import styles from './HUD.module.css';

export default function HUD() {
    const { players, currentPlayerIndex } = useGame();

    return (
        <div className={styles.hudContainer}>
            {players.map((player, index) => {
                const isCurrent = index === currentPlayerIndex;
                const xpForLevel = 500;
                const currentLevelXp = player.xp % xpForLevel;
                const progressPercent = (currentLevelXp / xpForLevel) * 100;

                return (
                    <div 
                        key={player.id} 
                        className={`${styles.playerCard} ${isCurrent ? styles.activeCard : ''}`}
                    >
                        {/* Avatar Column */}
                        <div 
                            className={styles.avatarBubble}
                            style={{ backgroundColor: player.color }}
                        >
                            {player.avatar}
                        </div>

                        {/* Content Column */}
                        <div className={styles.playerContent}>
                            <div className={styles.topRow}>
                                <span className={styles.name}>{player.name}</span>
                                <span className={styles.levelBadge}>Lvl {player.level}</span>
                                
                                <div className={styles.statsInline}>
                                    <span className={styles.statMini}>⭐ {player.score}</span>
                                    <span className={styles.statMini}>🔥 {player.streak || 0}</span>
                                </div>
                            </div>

                            {/* XP Progress Bar */}
                            <div className={styles.xpBarContainer}>
                                <div 
                                    className={styles.xpBarFill} 
                                    style={{ width: `${progressPercent}%` }}
                                />
                                <span className={styles.xpText}>
                                    {currentLevelXp}/{xpForLevel} XP
                                </span>
                            </div>
                        </div>

                        {/* Floating Medals (Absolute positioned to save space) */}
                        {player.achievements.length > 0 && (
                            <div className={styles.medalsOverlay}>
                                {player.achievements.slice(-2).map(a => (
                                    <span key={a.id} title={a.name} className={styles.medal}>{a.icon}</span>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
