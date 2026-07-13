import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Home.module.css';
import '../App.css';
import { ParentGate } from '../components/ParentGate';

// Pilares de valor (falam com o adulto: professor/pai).
const PILLARS = [
    {
        icon: '🧠',
        title: 'Aprende de verdade',
        text: 'Currículo do 1º ao 5º ano (BNCC), tabuada e um mapa que respeita os pré-requisitos. O sistema detecta onde a criança trava.',
    },
    {
        icon: '⚔️',
        title: 'Herói que evolui',
        text: 'A criança escolhe um herói da Bíblia e o vê ficar mais forte a cada habilidade dominada. Diversão de verdade, não estrelinha.',
    },
    {
        icon: '📊',
        title: 'Painel do Professor',
        text: 'Crie turmas, gere os PINs e acompanhe cada aluno com relatório pedagógico e diagnóstico automático.',
    },
];

export default function Home() {
    const navigate = useNavigate();
    const [showGateFor, setShowGateFor] = useState<'teacher' | null>(null);
    const [comingSoon, setComingSoon] = useState(false);

    const handleGateSuccess = () => {
        if (showGateFor === 'teacher') navigate('/teacher');
        setShowGateFor(null);
    };

    const symbols = ['+', '-', '×', '÷', '=', 'A', 'B', 'C', '!', '?', '📖', '✨', '🪐', '🔬', '🌱'];

    // Estilo base dos botões secundários (chunky).
    const chip = (bg: string, color: string): React.CSSProperties => ({
        padding: '10px 20px',
        fontSize: '1.1rem',
        backgroundColor: bg,
        color,
        border: '3px solid var(--color-ink)',
        borderRadius: '12px',
        fontWeight: 800,
        cursor: 'pointer',
        boxShadow: '4px 4px 0px rgba(0,0,0,0.15)',
    });

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
                            opacity: 0.1 + Math.random() * 0.3,
                        }}
                    >
                        {symbols[Math.floor(Math.random() * symbols.length)]}
                    </span>
                ))}
            </div>

            {/* Hero Section — valor primeiro, mas com JOGAR grande pra criança */}
            <div className={styles.heroSection}>
                <div className={styles.titleContainer}>
                    <h1 className={styles.mainTitle}>Trilha dos Campeões</h1>
                </div>

                <p className={styles.subTitle}>Matemática do 1º ao 5º ano que vira videogame 🎮</p>

                <div style={{
                    display: 'flex', gap: 12, marginTop: 24, alignItems: 'flex-end',
                    justifyContent: 'center', flexWrap: 'wrap',
                }}>
                    <img
                        src="/heroes/davi-5.png"
                        alt="Davi, um dos heróis da Trilha"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        style={{ height: 210, width: 'auto', filter: 'drop-shadow(0 10px 12px rgba(0,0,0,0.25))' }}
                    />
                    <img
                        src="/heroes/ester-5.png"
                        alt="Ester, uma das heroínas da Trilha"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        style={{ height: 230, width: 'auto', filter: 'drop-shadow(0 10px 12px rgba(0,0,0,0.25))' }}
                    />
                </div>

                <p style={{
                    maxWidth: 580, textAlign: 'center', fontWeight: 700, fontSize: '1.15rem',
                    color: 'var(--color-ink)', marginTop: 14, background: 'rgba(255,255,255,0.85)',
                    padding: '10px 18px', borderRadius: 14, lineHeight: 1.4,
                }}>
                    Heróis da Bíblia que crescem conforme a criança domina a matemática.
                    Coragem, fluência e diversão de verdade — para casa e escola.
                </p>

                <button className={styles.playButton} style={{ marginTop: 28 }} onClick={() => navigate('/hub')}>
                    ▶ JOGAR
                </button>

                {/* Atalhos da criança */}
                <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button style={chip('var(--color-yellow)', 'var(--color-ink)')} onClick={() => navigate('/heroes')}>
                        ⚔️ Meu Herói
                    </button>
                    <button style={chip('white', 'var(--color-ink)')} onClick={() => navigate('/customizar')}>
                        🎨 Personalizar
                    </button>
                </div>

                {/* Entrada de adulto */}
                <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button style={chip('var(--color-blue)', 'white')} onClick={() => setShowGateFor('teacher')}>
                        👨‍🏫 Sou Professor
                    </button>
                    <button style={{ ...chip('white', 'var(--color-ink)'), opacity: 0.7 }} title="Em breve" onClick={() => setComingSoon(true)}>
                        👨‍👩‍👧 Pais <span style={{ fontSize: '0.7rem' }}>(em breve)</span>
                    </button>
                </div>
            </div>

            {showGateFor && (
                <ParentGate onSuccess={handleGateSuccess} onCancel={() => setShowGateFor(null)} />
            )}

            {comingSoon && (
                <div
                    onClick={() => setComingSoon(false)}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000, padding: '20px',
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'white', color: 'var(--color-ink)', borderRadius: '16px',
                            border: '4px solid var(--color-ink)', padding: '2rem', maxWidth: '380px',
                            textAlign: 'center', boxShadow: '0 10px 0 rgba(0,0,0,0.2)',
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
                                borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 0 rgba(0,0,0,0.2)',
                            }}
                        >
                            Entendi!
                        </button>
                    </div>
                </div>
            )}

            {/* Pilares de valor (no lugar do antigo "Como Jogar") */}
            <div className={styles.rulesSection}>
                <h3 className={styles.rulesHeader}>Por que a Trilha?</h3>
                <p className={styles.rulesSub}>
                    Um videogame que ensina de verdade — e dá ao professor o raio-x de cada aluno.
                </p>

                <div className={styles.cardsContainer}>
                    {PILLARS.map((p) => (
                        <div
                            key={p.title}
                            style={{
                                background: 'white', border: '4px solid var(--color-ink)', borderRadius: 20,
                                padding: '28px 22px', boxShadow: '8px 8px 0 rgba(0,0,0,0.15)', textAlign: 'center',
                            }}
                        >
                            <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>{p.icon}</div>
                            <h4 style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0 0 10px', textTransform: 'uppercase' }}>{p.title}</h4>
                            <p style={{ fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.4, color: '#444', margin: 0 }}>{p.text}</p>
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => setShowGateFor('teacher')}
                    style={{
                        marginTop: 40, padding: '18px 40px', fontSize: '1.4rem', fontWeight: 900,
                        background: 'var(--color-blue)', color: 'white', border: '4px solid var(--color-ink)',
                        borderRadius: 20, cursor: 'pointer', boxShadow: '0 8px 0 var(--color-ink)',
                    }}
                >
                    👩‍🏫 Crie sua turma grátis
                </button>
            </div>
        </div>
    );
}
