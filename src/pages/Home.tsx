import { useNavigate } from 'react-router-dom';
import styles from './Home.module.css';
import '../App.css';

export default function Home() {
    const navigate = useNavigate();

    // A mix of symbols from Math, Portuguese, and Science for the dynamic background
    const symbols = ['+', '-', '×', '÷', '=', 'A', 'B', 'C', '!', '?', '📖', '✨', '🪐', '🔬', '🌱'];

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
                <p className={styles.rulesSub}>Role o dado, ande pelo tabuleiro e resolva os desafios para ganhar pontos e avançar! Conheça as casas marcadas:</p>

                <div className={styles.cardsContainer}>
                    {/* Green Card */}
                    <div className={styles.flipCard}>
                        <div className={`${styles.flipCardInner} ${styles.greenCard}`}>
                            <div className={styles.flipCardFront}>
                                <div className={styles.cardIcon}>✨</div>
                                <h4>Acerto Seguro</h4>
                            </div>
                            <div className={styles.flipCardBack}>
                                <p><strong>Acertando:</strong> Você avança 1 casa extra e ganha mais 50 pontos!</p>
                                <p className={styles.cardHint}>Caminho tranquilo.</p>
                            </div>
                        </div>
                    </div>

                    {/* Red Card */}
                    <div className={styles.flipCard}>
                        <div className={`${styles.flipCardInner} ${styles.redCard}`}>
                            <div className={styles.flipCardFront}>
                                <div className={styles.cardIcon}>🔥</div>
                                <h4>Desafio Épico</h4>
                            </div>
                            <div className={styles.flipCardBack}>
                                <p><strong>Acertou:</strong> Avance +2 casas e ganhe 100 pontos!</p>
                                <p><strong>Errou:</strong> Volte 1 ou 2 casas (dependendo da sua armadura)!</p>
                                <p className={styles.cardHint}>Risco e Recompensa.</p>
                            </div>
                        </div>
                    </div>

                    {/* Yellow Card */}
                    <div className={styles.flipCard}>
                        <div className={`${styles.flipCardInner} ${styles.yellowCard}`}>
                            <div className={styles.flipCardFront}>
                                <div className={styles.cardIcon}>🧠</div>
                                <h4>Enigma Rápido</h4>
                            </div>
                            <div className={styles.flipCardBack}>
                                <p>Perguntas que vão testar o seu raciocínio lógico e conhecimentos gerais.</p>
                                <p className={styles.cardHint}>Surpresas garantidas.</p>
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
