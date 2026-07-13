import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Home.module.css';
import '../App.css';
import { ParentGate } from '../components/ParentGate';

export default function Home() {
    const navigate = useNavigate();
    const [showGateFor, setShowGateFor] = useState<'teacher' | null>(null);
    const [comingSoon, setComingSoon] = useState(false);

    const handleGateSuccess = () => {
        if (showGateFor === 'teacher') navigate('/teacher');
        setShowGateFor(null);
    };

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

                <button
                    onClick={() => navigate('/heroes')}
                    style={{
                        marginTop: '12px',
                        padding: '12px 26px',
                        fontSize: '1.3rem',
                        backgroundColor: 'var(--color-yellow)',
                        color: 'var(--color-ink)',
                        border: '3px solid var(--color-ink)',
                        borderRadius: '12px',
                        fontWeight: '900',
                        cursor: 'pointer',
                        boxShadow: '4px 4px 0px rgba(0,0,0,0.15)'
                    }}
                >
                    ⚔️ ESCOLHER MEU HERÓI
                </button>

                <button
                    onClick={() => navigate('/customizar')}
                    style={{
                        marginTop: '8px',
                        padding: '8px 20px',
                        fontSize: '1.05rem',
                        backgroundColor: 'white',
                        color: 'var(--color-ink)',
                        border: '3px solid var(--color-ink)',
                        borderRadius: '12px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        boxShadow: '4px 4px 0px rgba(0,0,0,0.15)'
                    }}
                >
                    🎨 Personalizar
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
                        onClick={() => setShowGateFor('teacher')}
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
                    <button
                        className={styles.parentButton}
                        onClick={() => setComingSoon(true)}
                        title="Em breve"
                        style={{
                            padding: '10px 20px',
                            fontSize: '1.2rem',
                            backgroundColor: 'white',
                            color: 'var(--color-ink)',
                            border: '3px solid var(--color-ink)',
                            borderRadius: '12px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            boxShadow: '4px 4px 0px rgba(0,0,0,0.1)',
                            opacity: 0.7
                        }}
                    >
                        👨‍👩‍👧 PAIS <span style={{ fontSize: '0.7rem', verticalAlign: 'middle' }}>(em breve)</span>
                    </button>
                </div>
            </div>

            {showGateFor && (
                <ParentGate
                    onSuccess={handleGateSuccess}
                    onCancel={() => setShowGateFor(null)}
                />
            )}

            {comingSoon && (
                <div
                    onClick={() => setComingSoon(false)}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000, padding: '20px'
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'white', color: 'var(--color-ink)', borderRadius: '16px',
                            border: '4px solid var(--color-ink)', padding: '2rem', maxWidth: '380px',
                            textAlign: 'center', boxShadow: '0 10px 0 rgba(0,0,0,0.2)'
                        }}
                    >
                        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>👨‍👩‍👧</div>
                        <h2 style={{ marginBottom: '8px' }}>Painel da Família — em breve!</h2>
                        <p style={{ opacity: 0.8, marginBottom: '20px' }}>
                            Logo os pais poderão acompanhar o progresso do filho por aqui.
                            Por enquanto, o acompanhamento é pelo <strong>Painel do Professor</strong>.
                        </p>
                        <button
                            onClick={() => setComingSoon(false)}
                            style={{
                                padding: '12px 28px', fontSize: '1.1rem', fontWeight: 800,
                                background: 'var(--color-blue)', color: 'white', border: '3px solid var(--color-ink)',
                                borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 0 rgba(0,0,0,0.2)'
                            }}
                        >
                            Entendi!
                        </button>
                    </div>
                </div>
            )}


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
