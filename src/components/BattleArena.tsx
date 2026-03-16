import { useGame } from '../context/GameContext';
import styles from './BattleArena.module.css';

export default function BattleArena() {
    const { currentEnemy, players, currentPlayerIndex, gameState, submitAnswer, startBattle } = useGame();
    
    if (gameState.status !== 'battle' || !currentEnemy) return null;

    const player = players[currentPlayerIndex];
    const enemyHpPercent = (currentEnemy.hp / currentEnemy.maxHp) * 100;

    return (
        <div className={styles.overlay}>
            <div className={styles.arenaContainer}>
                <div className={styles.battleHeader}>
                    <h2>Desafio do Guardião!</h2>
                    <p>Vença o {currentEnemy.name} para seguir em frente e ganhar um Mascote!</p>
                </div>

                <div className={styles.entities}>
                    {/* ENEMY */}
                    <div className={styles.entity}>
                        <div className={styles.enemyIcon}>{currentEnemy.icon}</div>
                        <div className={styles.hpBarContainer}>
                            <div className={styles.hpBarLabel}>{currentEnemy.name} - LV {currentEnemy.level}</div>
                            <div className={styles.hpBar}>
                                <div 
                                    className={styles.hpFill} 
                                    style={{ width: `${enemyHpPercent}%`, backgroundColor: '#ff4757' }}
                                ></div>
                            </div>
                            <div className={styles.hpText}>{currentEnemy.hp} / {currentEnemy.maxHp} HP</div>
                        </div>
                    </div>

                    <div className={styles.vs}>VS</div>

                    {/* PLAYER */}
                    <div className={styles.entity}>
                        <div className={styles.playerIcon}>{player.avatar}</div>
                        <div className={styles.hpBarContainer}>
                            <div className={styles.hpBarLabel}>{player.name}</div>
                            <div className={styles.hpBar}>
                                <div 
                                    className={styles.hpFill} 
                                    style={{ width: '100%', backgroundColor: '#2ed573' }}
                                ></div>
                            </div>
                            <div className={styles.hpText}>ATIVO</div>
                        </div>
                    </div>
                </div>

                <div className={styles.inputArea}>
                    {!gameState.activeQuestion ? (
                        <p className={styles.loadingText}>Preparando próximo desafio...</p>
                    ) : (
                        <div className={`${styles.questionContainer} ${gameState.answerFeedback === 'correct' ? styles.correct : gameState.answerFeedback === 'wrong' ? styles.wrong : ''}`}>
                            <p className={styles.questionText}>"{gameState.activeQuestion.question}"</p>
                            <div className={styles.optionsGrid}>
                                {gameState.activeQuestion.options.map((opt: string, idx: number) => (
                                    <button 
                                        key={idx} 
                                        className={styles.optionButton}
                                        onClick={() => submitAnswer(opt)}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div className={styles.battleStatus}>
                        {player.streak > 0 && (
                            <span className={styles.streakBonus}>🔥 Sequência: +{player.streak * 10} Dano!</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
