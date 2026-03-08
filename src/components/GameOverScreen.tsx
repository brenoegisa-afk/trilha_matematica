import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { updateProfile } from '../utils/saveSystem';
import MathChest from './MathChest';
import styles from './GameOverScreen.module.css';

export default function GameOverScreen() {
    const { players, gameStatus } = useGame();
    const [showChestId, setShowChestId] = useState<string | null>(null);

    if (gameStatus !== 'finished') return null;

    // Sort players by score (descending)
    const rankedPlayers = [...players].sort((a, b) => b.score - a.score);

    const handlePlayAgain = () => {
        // Simple reload to reset everything cleanly
        window.location.href = '/setup';
    };

    const handleOpenChest = (reward: number) => {
        if (!showChestId) return;

        // Update the profile with the reward stars
        const p = players.find(player => player.id === showChestId);
        if (p) {
            const currentProfiles = JSON.parse(localStorage.getItem('@TrilhaCampeoes:Profiles') || '[]');
            const profile = currentProfiles.find((prof: any) => prof.id === p.id);
            if (profile) {
                updateProfile(p.id, { stars: profile.stars + reward });
            }
        }

        setShowChestId(null);
    };


    return (
        <div className={styles.overlay}>
            {/* Simple CSS Confetti */}
            <div className={styles.confettiContainer}>
                {[...Array(50)].map((_, i) => (
                    <div key={i} className={styles.confetti} style={{
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 3}s`,
                        animationDuration: `${2 + Math.random() * 3}s`,
                        backgroundColor: ['var(--color-yellow)', 'var(--color-red)', 'var(--color-green)', 'var(--color-blue)'][Math.floor(Math.random() * 4)]
                    }}></div>
                ))}
            </div>

            <div className={styles.container}>
                <h1 className={styles.title}>Fim de Jogo!</h1>
                <div className={styles.trophy}>🏆</div>

                <h2 className={styles.subtitle}>Ranking Final</h2>

                <div className={styles.rankingList}>
                    {rankedPlayers.map((player, index) => (
                        <div key={player.id} className={`${styles.rankingItem} ${index === 0 ? styles.firstPlace : ''}`}>
                            <div className={styles.rankPosition}>
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`}
                            </div>
                            <div className={styles.playerSpecs}>
                                <span className={styles.colorIndicator} style={{ backgroundColor: player.color }}></span>
                                <span className={styles.playerName}>{player.name}</span>
                            </div>
                            <div className={styles.playerScore}>
                                {player.score} pts
                                <span className={styles.earnedStars}>
                                    ( +{Math.floor(player.score / 10)} ⭐ )
                                </span>
                            </div>
                            <button
                                className={styles.collectBtn}
                                onClick={() => setShowChestId(player.id)}
                            >
                                📦 Coletar Baú
                            </button>
                        </div>
                    ))}
                </div>

                {showChestId && <MathChest onOpen={handleOpenChest} />}


                <div className={styles.buttons}>
                    <button className={styles.playAgainBtn} onClick={handlePlayAgain}>
                        Jogar Novamente
                    </button>
                </div>
            </div>
        </div>
    );
}
