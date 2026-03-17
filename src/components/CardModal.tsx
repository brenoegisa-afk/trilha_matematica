import { useGame } from '../context/GameContext';
import type { TileType } from '../core/types';
import styles from './CardModal.module.css';

export default function CardModal() {
    const {
        gameState,
        players,
        actions
    } = useGame();

    const {
        status: gameStatus,
        activeCardType,
        activeQuestion,
        currentPlayerIndex,
        answerFeedback,
        waitingFeedback
    } = gameState;

    if (gameStatus !== 'card_event' || !activeCardType || !activeQuestion) return null;

    const currentPlayer = players[currentPlayerIndex];

    const getCardStyle = (type: TileType) => {
        switch (type) {
            case 'Green': return { bg: 'var(--color-green)', title: 'Adição Bônus', icon: '✨', border: 'var(--color-green-dark)' };
            case 'Red': return { bg: 'var(--color-red)', title: 'Desafio Rápido', icon: '⚔️', border: 'var(--color-red-dark)' };
            case 'Yellow': return { bg: 'var(--color-yellow)', title: 'Raciocínio', icon: '🧠', border: 'var(--color-yellow-dark)' };
            case 'Blue': return { bg: 'var(--color-blue)', title: 'Item Especial', icon: '💎', border: 'var(--color-blue-dark)' };
            default: return { bg: '#fff', title: 'Carta', icon: '🃏', border: '#ccc' };
        }
    };

    const cardStyle = getCardStyle(activeCardType);
    const feedbackClass = answerFeedback === 'correct' ? styles.correctFeedback : answerFeedback === 'wrong' ? styles.wrongFeedback : '';

    return (
        <div className={styles.overlay}>
            <div 
                className={`${styles.card} ${feedbackClass}`} 
                style={{ 
                    border: `6px solid ${cardStyle.border}`,
                    boxShadow: `0 16px 0 ${cardStyle.border}, 0 24px 40px rgba(0,0,0,0.5)`
                }}
            >
                <div className={styles.headerIcon} style={{ borderColor: cardStyle.border }}>
                    {cardStyle.icon}
                </div>
                
                <h2 className={styles.title} style={{ color: cardStyle.border }}>
                    {cardStyle.title}
                </h2>
                
                <div className={styles.playerInfo}>
                    Vez de: <strong style={{ color: currentPlayer.color }}>{currentPlayer.name}</strong>
                </div>

                <div className={styles.content}>
                    <p className={styles.questionText}>"{activeQuestion.question}"</p>

                    {waitingFeedback ? (
                        <div className={styles.educationalFeedback}>
                            <h3 style={{ color: '#ff4757', marginBottom: '10px' }}>Puxa, não foi dessa vez!</h3>
                            <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>A resposta certa era:<br/><strong>{activeQuestion.answer}</strong></p>
                            {activeQuestion.explanation && (
                                <p style={{ 
                                    background: '#f9f9f9', 
                                    padding: '15px', 
                                    borderRadius: '12px', 
                                    fontSize: '0.95rem', 
                                    color: '#555',
                                    borderLeft: '4px solid #ff4757',
                                    marginBottom: '20px',
                                    fontStyle: 'italic',
                                    lineHeight: '1.4'
                                }}>
                                    💡 {activeQuestion.explanation}
                                </p>
                            )}
                            <button 
                                className={styles.optionButton} 
                                style={{ background: '#2ed573', color: 'white', width: '100%' }}
                                onClick={() => actions.acknowledgeFeedback()}
                            >
                                Entendi!
                            </button>
                        </div>
                    ) : (
                        <div className={styles.optionsGrid}>
                            {activeQuestion.options.map((opt: string, idx: number) => {
                                const letter = String.fromCharCode(65 + idx); 
                                return (
                                    <button
                                        key={idx}
                                        className={`${styles.optionButton} ${answerFeedback && (answerFeedback !== 'correct') ? styles.selected : ''}`}
                                        onClick={() => actions.submitAnswer(opt)}
                                        disabled={!!answerFeedback}
                                    >
                                        <span style={{ 
                                            display: 'inline-flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            background: '#f0f0f0', 
                                            width: '40px', 
                                            height: '40px', 
                                            borderRadius: '10px', 
                                            marginRight: '15px',
                                            fontSize: '1.2rem',
                                            color: '#aaa',
                                            border: '2px solid #ddd'
                                        }}>
                                            {letter}
                                        </span>
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
