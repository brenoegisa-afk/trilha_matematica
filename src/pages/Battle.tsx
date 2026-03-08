import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import styles from './Battle.module.css';
import { triggerConfetti } from '../utils/confetti';
import questionsData from '../data/questions.json';
import { supabase } from '../utils/supabaseClient';

interface BattleState {
    playerHp: number;
    playerMaxHp: number;
    monsterHp: number;
    monsterMaxHp: number;
    status: 'intro' | 'playing' | 'player_attack' | 'monster_attack' | 'victory' | 'defeat';
    streak: number;
}

// Dynamic Monster Generation
const generateMonster = (gamesPlayed: number) => {
    const monsterTypes = [
        { prefixes: ['Zorblax', 'Gork', 'Vex', 'Kraal'], suffixes: ['o Confuso', 'da Tabuada', 'Calculista', 'Sombrio'], emojis: ['👾', '👺', '👹', '👻'] },
        { prefixes: ['Pestilência', 'Vírus', 'Anomalia', 'Glitch'], suffixes: ['Matemática', 'dos Números', 'Lógica', 'do Caos'], emojis: ['🦠', '🕷️', '🦂', '🐉'] }
    ];

    const type = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
    const prefix = type.prefixes[Math.floor(Math.random() * type.prefixes.length)];
    const suffix = type.suffixes[Math.floor(Math.random() * type.suffixes.length)];
    const emoji = type.emojis[Math.floor(Math.random() * type.emojis.length)];

    // Difficulty scaling: Base HP 100 + 20 HP per game played (max 500)
    const baseHp = 100;
    const hpMultiplier = Math.min(20, gamesPlayed); // Cap difficulty scaling after 20 wins to keep it playable
    const maxHp = baseHp + (hpMultiplier * 20);

    return { id: `m_${Date.now()}`, name: `${prefix}, ${suffix}`, emoji, hp: maxHp, element: 'math' };
};

export default function Battle() {
    const navigate = useNavigate();
    const { players, selectedGrade } = useGame();

    // Fallback if accessed without setup
    const player = players[0] || { id: 'p1', name: 'Jogador', avatar: '🐱', mascot: '🐶', class_id: '', gamesPlayed: 0 };

    const [monster, setMonster] = useState(generateMonster(0));
    const [battle, setBattle] = useState<BattleState>({
        playerHp: 100,
        playerMaxHp: 100,
        monsterHp: 100,
        monsterMaxHp: 100,
        status: 'intro',
        streak: 0
    });

    const [currentQuestion, setCurrentQuestion] = useState<{ question: string, options: string[], answer: string } | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [isProcessingTerm, setIsProcessingTerm] = useState(false);

    // Sound Helper
    const playSound = (type: 'hit' | 'damage' | 'victory') => {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'hit') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(400, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.2);
        } else if (type === 'damage') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
        }
    };

    // Load initial state
    useEffect(() => {
        // Generate monster scaled to player's experience
        let gamesPlayed = 0;
        import('../utils/saveSystem').then(({ getSavedProfiles }) => {
            const allProfiles = getSavedProfiles();
            const prof = allProfiles.find((p: any) => p.id === player.id);
            if (prof) gamesPlayed = prof.gamesPlayed || 0;

            const dynamicMonster = generateMonster(gamesPlayed);
            setMonster(dynamicMonster);

            setBattle(prev => ({
                ...prev,
                monsterHp: dynamicMonster.hp,
                monsterMaxHp: dynamicMonster.hp,
                status: 'playing'
            }));
        });

        loadNextQuestion();
    }, []);

    const loadNextQuestion = async () => {
        // Try Custom DB Questions first
        if (player.class_id) {
            try {
                const { data, error } = await supabase
                    .from('teacher_questions')
                    .select('*')
                    .eq('class_id', player.class_id)
                    .eq('grade_level', selectedGrade);

                if (!error && data && data.length > 0) {
                    const randomQ = data[Math.floor(Math.random() * data.length)];
                    setCurrentQuestion({
                        question: randomQ.question,
                        answer: randomQ.answer,
                        options: typeof randomQ.options === 'string' ? JSON.parse(randomQ.options) : randomQ.options
                    });
                    return;
                }
            } catch (e) {
                console.warn("Falling back to local questions");
            }
        }

        // Fallback to local questions
        const allGrades = questionsData.grades as any;
        let gradePool = allGrades[selectedGrade] || allGrades['1-2'];

        // Flatten all categories for battle mode
        let allQuestions: any[] = [];
        Object.values(gradePool).forEach((arr: any) => allQuestions.push(...arr));

        if (allQuestions.length > 0) {
            const randomQ = allQuestions[Math.floor(Math.random() * allQuestions.length)];
            // Shuffle options
            const shuffledOptions = [...randomQ.options].sort(() => Math.random() - 0.5);
            setCurrentQuestion({
                ...randomQ,
                options: shuffledOptions
            });
        }
    };

    const handleAnswer = (selectedAns: string) => {
        if (isProcessingTerm || !currentQuestion) return;
        setIsProcessingTerm(true);

        const isCorrect = selectedAns === currentQuestion.answer;

        // Analyze question type for elemental skills
        const isMultiplication = currentQuestion.question.includes('x') || currentQuestion.question.includes('vezes');
        const isDivision = currentQuestion.question.includes('÷') || currentQuestion.question.includes('dividido');
        const isSubtraction = currentQuestion.question.includes('-');

        if (isCorrect) {
            // Player Attacks
            setBattle(prev => ({ ...prev, status: 'player_attack', streak: prev.streak + 1 }));

            // Critical hit logic (streak >= 3)
            const isCrit = battle.streak >= 2;
            let damage = isCrit ? 35 : 15;

            // 🐾 Elemental Mascot Skills
            let skillFeedback = '';
            let healAmount = 0;
            const mascotRaw = player.mascot || '🐶';

            // 🐙 Octopus - Multiplication Master
            if (mascotRaw.includes('🐙') && isMultiplication) {
                damage *= 2;
                skillFeedback = 'Poder do Polvo! (Dano x2)';
            }
            // 🦊 Fox - Armor Piercing (Division/Subtraction)
            else if (mascotRaw.includes('🦊') && (isDivision || isSubtraction)) {
                damage += 15;
                skillFeedback = 'Garras da Raposa! (+15 Dano)';
            }
            // 🦉 Owl / Birds - Healer
            else if ((mascotRaw.includes('🦉') || mascotRaw.includes('🦅') || mascotRaw.includes('🦜'))) {
                healAmount = 10;
                skillFeedback = 'Brisa Curativa! (+10 HP)';
            }

            setFeedback(skillFeedback ? `${isCrit ? 'Crítico! ' : ''}${skillFeedback}` : (isCrit ? 'Crítico!' : 'Ataque!'));
            playSound('hit');

            setTimeout(() => {
                setBattle(prev => {
                    const newMonsterHp = Math.max(0, prev.monsterHp - damage);
                    const newPlayerHp = Math.min(prev.playerMaxHp, prev.playerHp + healAmount);

                    if (newMonsterHp === 0) {
                        triggerConfetti();
                        playSound('victory');

                        // Save Progress 
                        import('../utils/saveSystem').then(({ getSavedProfiles, saveProfiles }) => {
                            const allProfiles = getSavedProfiles();
                            const profIdx = allProfiles.findIndex((prof: any) => prof.id === player.id);
                            if (profIdx !== -1) {
                                allProfiles[profIdx].gamesPlayed += 1;
                                allProfiles[profIdx].totalScore = (allProfiles[profIdx].totalScore || 0) + 200; // Battle score
                                allProfiles[profIdx].stars += 50; // Battle coin reward
                                saveProfiles(allProfiles);

                                // The backend sync happens automatically inside updateProfile, 
                                // but here we are doing manual array update, so we need to force it.
                                import('../utils/saveSystem').then(m => m.syncProfileToCloud(allProfiles[profIdx]));
                            }
                        });


                        return { ...prev, monsterHp: 0, playerHp: newPlayerHp, status: 'victory' };
                    }
                    return { ...prev, monsterHp: newMonsterHp, playerHp: newPlayerHp, status: 'playing' };
                });

                if (battle.monsterHp - damage > 0) {
                    setIsProcessingTerm(false);
                    loadNextQuestion();
                    setFeedback(null);
                }
            }, 1000);

        } else {
            // Monster Attacks
            setBattle(prev => ({ ...prev, status: 'monster_attack', streak: 0 }));
            setFeedback('Errou!');
            playSound('damage');

            setTimeout(() => {
                setBattle(prev => {
                    const newPlayerHp = Math.max(0, prev.playerHp - 20);
                    if (newPlayerHp === 0) {

                        // Save Progress (Consolation / Loss stats)
                        import('../utils/saveSystem').then(({ getSavedProfiles, saveProfiles }) => {
                            const allProfiles = getSavedProfiles();
                            const profIdx = allProfiles.findIndex((prof: any) => prof.id === player.id);
                            if (profIdx !== -1) {
                                allProfiles[profIdx].gamesPlayed += 1;
                                allProfiles[profIdx].totalScore = (allProfiles[profIdx].totalScore || 0) + 10; // Tiny participation score
                                allProfiles[profIdx].stars += 5; // Tiny consolation coin reward
                                saveProfiles(allProfiles);

                                import('../utils/saveSystem').then(m => m.syncProfileToCloud(allProfiles[profIdx]));
                            }
                        });


                        return { ...prev, playerHp: 0, status: 'defeat' };
                    }
                    return { ...prev, playerHp: newPlayerHp, status: 'playing' };
                });

                if (battle.playerHp - 20 > 0) {
                    setIsProcessingTerm(false);
                    loadNextQuestion();
                    setFeedback(null);
                }
            }, 1000);
        }
    };

    const calculateHpWidth = (current: number, max: number) => {
        return Math.max(0, Math.min(100, (current / max) * 100)) + '%';
    };

    return (
        <div className={styles.battleContainer}>
            <header className={styles.header}>
                <button onClick={() => navigate('/setup')} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>
                    ⬅ Voltar
                </button>
                <h1 className={styles.title}>Batalha de Mascotes</h1>
                <div></div>
            </header>

            <div className={styles.arena}>

                {/* Visual Feedback Overlay */}
                {feedback && (
                    <div className={`${styles.feedbackOverlay} ${feedback === 'Errou!' ? styles.feedbackWrong : styles.feedbackCorrect}`}>
                        {feedback}
                    </div>
                )}

                {/* Monster Side */}
                <div className={styles.combatantRow}>
                    <div className={styles.monsterSide}>
                        <div className={styles.healthBarContainer}>
                            <div className={`${styles.healthFill} ${styles.healthFillMonster}`} style={{ width: calculateHpWidth(battle.monsterHp, battle.monsterMaxHp) }}></div>
                            <span className={styles.healthText}>{battle.monsterHp} / {battle.monsterMaxHp}</span>
                        </div>
                        <h3 className={styles.name}>{monster.name}</h3>
                    </div>
                    <div className={`${styles.spriteContainer} ${styles.monsterSprite} ${battle.status === 'monster_attack' ? styles.attackAnim : ''} ${battle.status === 'player_attack' ? styles.damageAnim : ''}`}>
                        {monster.emoji}
                    </div>
                </div>

                {/* Player Side */}
                <div className={styles.combatantRow} style={{ flexDirection: 'row-reverse' }}>
                    <div className={styles.playerSide}>
                        <div className={styles.healthBarContainer}>
                            <div className={styles.healthFill} style={{ width: calculateHpWidth(battle.playerHp, battle.playerMaxHp) }}></div>
                            <span className={styles.healthText}>{battle.playerHp} / {battle.playerMaxHp}</span>
                        </div>
                        <h3 className={styles.name}>{player.name} & {player.mascot || '🐶'}</h3>
                        {battle.streak >= 2 && <div style={{ color: 'var(--color-yellow)', fontWeight: 'bold' }}>🔥 Streak: {battle.streak}x</div>}
                    </div>
                    <div className={`${styles.spriteContainer} ${styles.playerSprite} ${battle.status === 'player_attack' ? styles.attackAnim : ''} ${battle.status === 'monster_attack' ? styles.damageAnim : ''}`}>
                        {player.mascot || '🐶'}
                    </div>
                </div>

                {/* Question Panel */}
                {battle.status === 'playing' && currentQuestion && (
                    <div className={styles.questionPanel}>
                        <div className={styles.questionText}>
                            {currentQuestion.question}
                        </div>
                        <div className={styles.optionsGrid}>
                            {currentQuestion.options.map((opt, i) => (
                                <button
                                    key={i}
                                    className={styles.optionBtn}
                                    onClick={() => handleAnswer(opt)}
                                    disabled={isProcessingTerm}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

            </div>

            {/* End Game Overlays */}
            {battle.status === 'victory' && (
                <div className={styles.postMatchOverlay}>
                    <div className={styles.postMatchCard}>
                        <h2>Vitória! 🎉</h2>
                        <p>Você e seu mascote derrotaram {monster.name}!</p>
                        <p style={{ fontSize: '2rem', margin: '20px 0' }}>⭐ +50 Moedas</p>
                        <button className={styles.homeBtn} onClick={() => navigate('/ranking')}>Ver Ranking Globel</button>
                    </div>
                </div>
            )}

            {battle.status === 'defeat' && (
                <div className={styles.postMatchOverlay}>
                    <div className={styles.postMatchCard} style={{ borderColor: 'var(--color-red)' }}>
                        <h2 style={{ color: 'var(--color-red)' }}>Derrota... 💀</h2>
                        <p>Seu mascote ficou sem energia.</p>
                        <button className={styles.homeBtn} onClick={() => navigate('/setup', { state: { gameMode: 'battle' } })}>Tentar Novamente</button>
                    </div>
                </div>
            )}

        </div>
    );
}
