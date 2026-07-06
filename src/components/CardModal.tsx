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
            case 'Green': return { bg: 'var(--color-green)', title: 'Operações Básicas', icon: '✨', border: 'var(--color-green-dark)' };
            case 'Red': return { bg: 'var(--color-red)', title: 'Desafio Rápido', icon: '⚔️', border: 'var(--color-red-dark)' };
            case 'Yellow': return { bg: 'var(--color-yellow)', title: 'Raciocínio', icon: '🧠', border: 'var(--color-yellow-dark)' };
            case 'Blue': return { bg: 'var(--color-blue)', title: 'Item Especial', icon: '💎', border: 'var(--color-blue-dark)' };
            default: return { bg: '#fff', title: 'Carta', icon: '🃏', border: '#ccc' };
        }
    };

    const playAudio = (text: string, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation(); // Evita que o clique no áudio selecione a opção
        }
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel(); // Para áudio anterior
            
            // Corrige a pronúncia de sinais matemáticos em português
            let spokenText = text
                .replace(/-/g, ' menos ')
                .replace(/\+/g, ' mais ')
                .replace(/x/i, ' vezes ')
                .replace(/÷/g, ' dividido por ')
                .replace(/=/g, ' igual a ');

            const utterance = new SpeechSynthesisUtterance(spokenText);
            utterance.lang = 'pt-BR';
            window.speechSynthesis.speak(utterance);
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

                <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
                    {activeQuestion.isReview && (
                        <span style={{ background: 'var(--color-yellow)', color: '#333', padding: '4px 8px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            🔄 Revisão
                        </span>
                    )}
                    {activeQuestion.bnccCode && (
                        <span style={{ background: '#eee', color: '#666', padding: '4px 8px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #ccc' }}>
                            {activeQuestion.bnccCode}
                        </span>
                    )}
                </div>

                <div className={styles.scrollArea}>
                    <div className={styles.content}>
                        <div className={styles.questionText}>
                            <span>"{activeQuestion.question}"</span>
                            <button className={styles.ttsButton} onClick={() => playAudio(activeQuestion.question)} title="Ouvir Pergunta">🔊</button>
                        </div>

                        {waitingFeedback ? (
                            <div className={styles.educationalFeedback}>
                                {answerFeedback === 'correct' ? (
                                    <>
                                        <div className={styles.feedbackIcon}>🌟</div>
                                        <h3 className={styles.feedbackTitleSuccess}>Excelente!</h3>
                                        <p className={styles.feedbackMessage}>
                                            Você acertou! A resposta é mesmo <strong>{activeQuestion.answer}</strong>.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className={styles.feedbackIcon}>💡</div>
                                        <h3 className={styles.feedbackTitleError}>Puxa, quase lá!</h3>
                                        <p className={styles.feedbackMessage}>
                                            A resposta correta era: <span className={styles.correctAnswerHighlight}>{activeQuestion.answer}</span>
                                        </p>

                                        {/* Structured Explanation Render */}
                                        {activeQuestion.explanation && (
                                            <div className={styles.explanationBox}>
                                                {typeof activeQuestion.explanation === 'string' ? (
                                                    // Fallback for old string explanations
                                                    <p className={styles.explanationText}>{activeQuestion.explanation}</p>
                                                ) : (
                                                    // New Structured Explanation
                                                    <div className={styles.structuredExplanation}>
                                                        <h4 className={styles.explanationLabel}>
                                                            {activeQuestion.explanation.title || 'Vamos aprender juntos!'}
                                                        </h4>
                                                        <ul className={styles.explanationSteps}>
                                                            {activeQuestion.explanation.steps.map((step: string, index: number) => (
                                                                <li key={index} className={styles.explanationStep}>
                                                                    <span className={styles.stepNumber}>{index + 1}</span>
                                                                    <span>{step}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}

                                {(!activeQuestion.isReinforcement && answerFeedback === 'wrong') ? (
                                    <button 
                                        className={`${styles.acknowledgeButton} ${styles.reinforcementBtn}`}
                                        onClick={() => actions.startReinforcement?.()}
                                        style={{ backgroundColor: 'var(--color-yellow)', color: '#333' }}
                                    >
                                        Exercício de Reforço 🔄
                                    </button>
                                ) : (
                                    <button 
                                        className={styles.acknowledgeButton}
                                        onClick={() => actions.acknowledgeFeedback()}
                                    >
                                        {answerFeedback === 'correct' ? 'Perfeito! 🎉' : 'Entendi! 👍'}
                                    </button>
                                )}
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
                                            style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <span style={{ 
                                                    display: 'inline-flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center', 
                                                    background: '#f0f0f0', 
                                                    width: '32px', 
                                                    height: '32px', 
                                                    borderRadius: '8px', 
                                                    marginRight: '12px',
                                                    fontSize: '1rem',
                                                    color: '#aaa',
                                                    border: '2px solid #ddd',
                                                    flexShrink: 0
                                                }}>
                                                    {letter}
                                                </span>
                                                <span style={{ flex: 1 }}>{opt}</span>
                                            </div>
                                            <div 
                                                className={styles.ttsButton} 
                                                style={{ width: '40px', height: '40px', fontSize: '1.2rem', marginLeft: '10px' }}
                                                onClick={(e) => playAudio(opt, e)}
                                                title="Ouvir Alternativa"
                                            >
                                                🔊
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
