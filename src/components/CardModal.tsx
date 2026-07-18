import { useMemo } from 'react';
import { useGame } from '../context/GameContext';
import type { TileType } from '../core/types';
import styles from './CardModal.module.css';

// Reações variadas de acerto/erro — antes era sempre a mesma ("🌟 Excelente!"
// / "💡 Puxa, quase lá!"), e repetição idêntica cansa rápido numa criança
// pequena (achado da squad de game design, ROADMAP §11.2). Erro continua
// gentil, sem punição pesada — só varia o tom.
const CORRECT_REACTIONS = [
    { icon: '🌟', title: 'Excelente!' },
    { icon: '🎉', title: 'Mandou bem!' },
    { icon: '🚀', title: 'Isso aí!' },
    { icon: '🏆', title: 'Show de bola!' },
    { icon: '💪', title: 'Você é fera nisso!' },
    { icon: '🔥', title: 'Pegando fogo!' },
];

const WRONG_REACTIONS = [
    { icon: '💡', title: 'Puxa, quase lá!' },
    { icon: '🤔', title: 'Quase isso!' },
    { icon: '📚', title: 'Vamos aprender juntos!' },
    { icon: '✨', title: 'Essa foi difícil, hein?' },
];

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

    // Sorteado uma vez por pergunta (não a cada re-render), para não trocar de
    // reação no meio da exibição do feedback. Hook precisa vir antes de
    // qualquer `return` condicional (Rules of Hooks).
    const reaction = useMemo(() => {
        const pool = answerFeedback === 'correct' ? CORRECT_REACTIONS : WRONG_REACTIONS;
        return pool[Math.floor(Math.random() * pool.length)];
    }, [activeQuestion?.question, answerFeedback]);

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

            // Prepara o texto para leitura em português:
            const spokenText = text
                // 1. Remove emojis (o TTS lia "🍎" como "maçã vermelha" e embolava a frase)
                .replace(/\p{Extended_Pictographic}/gu, ' ')
                // 2. Sinais matemáticos como operadores (só entre números, para não
                //    quebrar palavras como "próximo" ou "explique")
                .replace(/(\d)\s*[x×]\s*(\d)/gi, '$1 vezes $2')
                .replace(/(\d)\s*÷\s*(\d)/g, '$1 dividido por $2')
                .replace(/(\d)\s*[-−]\s*(\d)/g, '$1 menos $2')
                .replace(/(\d)\s*\+\s*(\d)/g, '$1 mais $2')
                .replace(/=/g, ' igual a ')
                // 3. Limpa espaços sobrando
                .replace(/\s+/g, ' ')
                .trim();

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

                {/* O código BNCC é informação para o professor, não para a criança —
                    exibido no relatório/diagnóstico, nunca no card do aluno. */}
                <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
                    {activeQuestion.isReview && (
                        <span style={{ background: 'var(--color-yellow)', color: '#333', padding: '4px 8px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            🔄 Revisão
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
                                        <div className={styles.feedbackIcon}>{reaction.icon}</div>
                                        <h3 className={styles.feedbackTitleSuccess}>{reaction.title}</h3>
                                        <p className={styles.feedbackMessage}>
                                            Você acertou! A resposta é mesmo <strong>{activeQuestion.answer}</strong>.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className={styles.feedbackIcon}>{reaction.icon}</div>
                                        <h3 className={styles.feedbackTitleError}>{reaction.title}</h3>
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
