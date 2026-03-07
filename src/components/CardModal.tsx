import { useGame } from '../context/GameContext';
import type { TileType } from '../context/GameContext';
import styles from './CardModal.module.css';

export default function CardModal() {
    const {
        gameStatus,
        activeCardType,
        activeQuestion,
        currentPlayerIndex,
        players,
        submitAnswer,
        answerFeedback
    } = useGame();

    if (gameStatus !== 'card_event' || !activeCardType || !activeQuestion) return null;

    const currentPlayer = players[currentPlayerIndex];

    const getCardStyle = (type: TileType) => {
        switch (type) {
            case 'Green': return { bg: 'var(--color-green)', title: 'Adição Bônus (+)' };
            case 'Red': return { bg: 'var(--color-red)', title: 'Desafio Rápido (x)' };
            case 'Yellow': return { bg: 'var(--color-yellow)', title: 'Raciocínio Lógico (?)' };
            case 'Blue': return { bg: 'var(--color-blue)', title: 'Item Especial (★)' };
            default: return { bg: '#fff', title: 'Carta' };
        }
    };

    const cardStyle = getCardStyle(activeCardType);

    const feedbackClass = answerFeedback === 'correct' ? styles.correctFeedback : answerFeedback === 'wrong' ? styles.wrongFeedback : '';

    return (
        <div className={styles.overlay}>
            <div className={`${styles.card} ${feedbackClass}`} style={{ backgroundColor: cardStyle.bg }}>
                <h2 className={styles.title}>{cardStyle.title}</h2>
                <div className={styles.playerInfo}>
                    Vez de: <strong>{currentPlayer.name}</strong>
                </div>

                <div className={styles.content}>
                    <p className={styles.questionText}>"{activeQuestion.question}"</p>

                    <div className={styles.optionsGrid}>
                        {activeQuestion.options.map((opt: string, idx: number) => (
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
            </div>
        </div>
    );
}
