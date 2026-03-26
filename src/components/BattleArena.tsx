import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import styles from './BattleArena.module.css';

export default function BattleArena() {
    const { currentEnemy, players, currentPlayerIndex, gameState, actions } = useGame();
    const [hitAnimation, setHitAnimation] = useState<'player' | 'enemy' | null>(null);

    useEffect(() => {
        if (gameState.answerFeedback === 'correct') {
            setHitAnimation('enemy');
        } else if (gameState.answerFeedback === 'wrong') {
            setHitAnimation('player');
        } else {
            setHitAnimation(null);
        }
        
        const timer = setTimeout(() => setHitAnimation(null), 500);
        return () => clearTimeout(timer);
    }, [gameState.answerFeedback]);
    
    if (gameState.status !== 'battle' || !currentEnemy) return null;

    const player = players[currentPlayerIndex];
    const enemyHpPercent = (currentEnemy.hp / currentEnemy.maxHp) * 100;
    const playerMaxHp = player.maxHp || 100;
    // Ensure HP is defined or default to max
    const currentHp = player.hp !== undefined ? player.hp : playerMaxHp;
    const playerHpPercent = (currentHp / playerMaxHp) * 100;

    return (
        <div className={styles.overlay}>
            <div className={`${styles.arenaContainer} ${hitAnimation === 'player' ? styles.playerHit : ''}`}>
                <div className={styles.battleHeader}>
                    <h2>Desafio do Guardião!</h2>
                    <p>Vença o {currentEnemy.name} para seguir em frente e ganhar um Mascote!</p>
                </div>

                <div className={styles.entities}>
                    {/* ENEMY */}
                    <div className={`${styles.entity} ${hitAnimation === 'enemy' ? styles.enemyHit : ''}`}>
                        <div className={styles.enemyIcon}>{currentEnemy.icon}</div>
                        <div className={styles.hpBarContainer}>
                            <div className={styles.hpBarLabel}>{currentEnemy.name} - LV {currentEnemy.level}</div>
                            <div className={styles.hpBar}>
                                <div 
                                    className={styles.hpFill} 
                                    style={{ width: `${Math.max(0, enemyHpPercent)}%`, backgroundColor: '#ff4757' }}
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
                                    style={{ width: `${Math.max(0, playerHpPercent)}%`, backgroundColor: '#2ed573' }}
                                ></div>
                            </div>
                            <div className={styles.hpText}>{currentHp} / {playerMaxHp} HP</div>
                        </div>
                    </div>
                </div>

                <div className={styles.inputArea}>
                    {!gameState.activeQuestion ? (
                        <p className={styles.loadingText}>Preparando próximo desafio...</p>
                    ) : (
                        <div className={`${styles.questionContainer} ${gameState.answerFeedback === 'correct' ? styles.correct : gameState.answerFeedback === 'wrong' ? styles.wrong : ''}`}>
                            <p className={styles.questionText}>"{gameState.activeQuestion.question}"</p>
                            {gameState.waitingFeedback ? (
                                <div className={styles.educationalFeedback}>
                                    <h3 style={{ color: '#ff4757', marginBottom: '8px', fontSize: '1.2rem' }}>Puxa, não foi dessa vez!</h3>
                                    <p style={{ fontSize: '1rem', marginBottom: '10px', fontWeight: 'bold' }}>A resposta certa era:<br/><span style={{fontSize: '1.5rem', color: '#ff4757'}}>{gameState.activeQuestion.answer}</span></p>
                                    {gameState.activeQuestion.explanation && (
                                        <div style={{ 
                                            background: 'rgba(255, 255, 255, 0.9)', 
                                            padding: '12px', 
                                            borderRadius: '12px', 
                                            fontSize: '0.9rem', 
                                            color: '#333',
                                            borderLeft: '4px solid #ff4757',
                                            marginBottom: '15px',
                                            textAlign: 'left',
                                            lineHeight: '1.4'
                                        }}>
                                            💡 {gameState.activeQuestion.explanation}
                                        </div>
                                    )}
                                    <button 
                                        className={styles.optionButton} 
                                        style={{ background: '#2ed573', color: 'white', width: '100%', padding: '12px', borderRadius: '12px', border: 'none', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}
                                        onClick={() => actions.acknowledgeFeedback()}
                                    >
                                        Continuar Batalha!
                                    </button>
                                </div>
                            ) : (
                                <div className={styles.optionsGrid}>
                                    {gameState.activeQuestion.options.map((opt: string, idx: number) => (
                                        <button 
                                            key={idx} 
                                            className={`${styles.optionButton} ${gameState.answerFeedback && (gameState.answerFeedback !== 'correct') ? styles.selected : ''}`}
                                            onClick={() => actions.submitAnswer(opt)}
                                            disabled={!!gameState.answerFeedback}
                                        >
                                            <span style={{ 
                                                display: 'inline-flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                background: '#f0f0f0', 
                                                width: '28px', 
                                                height: '28px', 
                                                borderRadius: '8px', 
                                                marginRight: '10px',
                                                fontSize: '0.9rem',
                                                color: '#aaa',
                                                border: '2px solid #ddd'
                                            }}>
                                                {String.fromCharCode(65 + idx)}
                                            </span>
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            )}
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
