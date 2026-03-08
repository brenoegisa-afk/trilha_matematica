import { useNavigate } from 'react-router-dom';
import styles from './Home.module.css';
import '../App.css';

export default function Home() {
    const navigate = useNavigate();

    // A simple array of math symbols for the parallax background
    const symbols = ['+', '-', '×', '÷', '=', '%', '?', '!', '1', '2', '3'];

    return (
        <div className={styles.homeContainer}>
            {/* Parallax Background */}
            <div className={styles.parallaxBg}>
                {[...Array(25)].map((_, i) => (
                    <span
                        key={i}
                        className={styles.mathSymbol}
                        style={{
                            left: `${Math.random() * 100}vw`,
                            animationDuration: `${12 + Math.random() * 25}s`,
                            animationDelay: `-${Math.random() * 20}s`,
                            fontSize: `${2 + Math.random() * 4}rem`,
                            opacity: 0.1 + Math.random() * 0.3
                        }}
                    >
                        {symbols[Math.floor(Math.random() * symbols.length)]}
                    </span>
                ))}
            </div>

            {/* Hero Section */}
            <div className={styles.heroSection}>
                <div className={styles.titleContainer}>
                    <h1 className={styles.mainTitle}>Trilha dos Campeões</h1>
                    <h2 className={styles.subTitle}>DA MATEMÁTICA</h2>
                </div>

                <button
                    className={styles.playButton}
                    onClick={() => navigate('/hub')}
                >
                    COMEÇAR JORNADA!
                </button>


                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                    <button
                        className={styles.rankingButton}
                        onClick={() => navigate('/ranking')}
                        style={{
                            padding: '10px 20px',
                            fontSize: '1.2rem',
                            backgroundColor: 'white',
                            color: 'var(--color-ink)',
                            border: '3px solid var(--color-ink)',
                            borderRadius: '12px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            boxShadow: '4px 4px 0px rgba(0,0,0,0.1)'
                        }}
                    >
                        🏆 RANKING
                    </button>
                    <button
                        className={styles.teacherButton}
                        onClick={() => navigate('/teacher')}
                        style={{
                            padding: '10px 20px',
                            fontSize: '1.2rem',
                            backgroundColor: 'var(--color-blue)',
                            color: 'white',
                            border: '3px solid var(--color-ink)',
                            borderRadius: '12px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            boxShadow: '4px 4px 0px rgba(0,0,0,0.1)'
                        }}
                    >
                        👨‍🏫 PROFESSOR
                    </button>
                </div>
            </div>


            {/* Interactive Rules Section */}
            <div className={styles.rulesSection}>
                <h3 className={styles.rulesHeader}>Como Jogar?</h3>
                <p className={styles.rulesSub}>Role o dado, ande pelo tabuleiro e resolva os desafios matemáticos para ganhar pontos e avançar! Conheça as cartas:</p>

                <div className={styles.cardsContainer}>
                    {/* Green Card */}
                    <div className={styles.flipCard}>
                        <div className={`${styles.flipCardInner} ${styles.greenCard}`}>
                            <div className={styles.flipCardFront}>
                                <div className={styles.cardIcon}>➕</div>
                                <h4>Avanço Seguro</h4>
                            </div>
                            <div className={styles.flipCardBack}>
                                <p><strong>Acertou:</strong> Avance +1 casa e ganhe 50 pontos!</p>
                                <span>Questões básicas de Adição e Subtração.</span>
                            </div>
                        </div>
                    </div>

                    {/* Red Card */}
                    <div className={styles.flipCard}>
                        <div className={`${styles.flipCardInner} ${styles.redCard}`}>
                            <div className={styles.flipCardFront}>
                                <div className={styles.cardIcon}>⚠️</div>
                                <h4>Desafio Rápido</h4>
                            </div>
                            <div className={styles.flipCardBack}>
                                <p><strong>Acertou:</strong> Avance +2 casas e ganhe 100 pontos!</p>
                                <p><strong>Errou:</strong> Volte 1 casa!</p>
                                <span>Risco e Recompensa.</span>
                            </div>
                        </div>
                    </div>

                    {/* Yellow Card */}
                    <div className={styles.flipCard}>
                        <div className={`${styles.flipCardInner} ${styles.yellowCard}`}>
                            <div className={styles.flipCardFront}>
                                <div className={styles.cardIcon}>🧠</div>
                                <h4>Raciocínio</h4>
                            </div>
                            <div className={styles.flipCardBack}>
                                <p><strong>Acertou:</strong> Ganhe 30 pontos e Jogue o dado novamente!</p>
                                <span>Enigmas de Lógica e Sequências.</span>
                            </div>
                        </div>
                    </div>

                    {/* Blue Card */}
                    <div className={styles.flipCard}>
                        <div className={`${styles.flipCardInner} ${styles.blueCard}`}>
                            <div className={styles.flipCardFront}>
                                <div className={styles.cardIcon}>🛡️</div>
                                <h4>Item Mágico</h4>
                            </div>
                            <div className={styles.flipCardBack}>
                                <p>Ganhe um <strong>Escudo Protetor</strong> valendo 20 pontos.</p>
                                <span>Use-o automaticamente para se salvar de uma penalidade Vermelha!</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
