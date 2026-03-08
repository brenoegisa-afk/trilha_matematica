import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import questionsData from '../data/questions.json';
import { triggerConfetti } from '../utils/confetti';
import { getSavedProfiles, updateProfile } from '../utils/saveSystem';
import type { SaveProfile } from '../utils/saveSystem';
import { useGame } from '../context/GameContext';
import styles from './Arena.module.css';

export default function Arena() {
    const navigate = useNavigate();
    const location = useLocation();
    const { players: contextPlayers } = useGame();

    const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
    const [timeLeft, setTimeLeft] = useState(60);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [currentQ, setCurrentQ] = useState<any>(null);
    const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
    const [profiles, setProfiles] = useState<SaveProfile[]>([]);
    const [selectedProfileId, setSelectedProfileId] = useState<string>('');

    useEffect(() => {
        setProfiles(getSavedProfiles());

        // If coming from setup, pick the first player automatically
        if (location.state?.fromSetup && contextPlayers.length > 0) {
            setSelectedProfileId(contextPlayers[0].id);
        }
    }, [location.state, contextPlayers]);


    const generateQuestion = useCallback(() => {
        const pool = questionsData.grades['1-2'].Green.concat(
            questionsData.grades['3-4'].Green,
            questionsData.grades['5'].Green
        );
        const randomQ = pool[Math.floor(Math.random() * pool.length)];
        setCurrentQ(randomQ);
        setFeedback('none');
    }, []);

    useEffect(() => {
        if (gameState === 'playing' && timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0) {
            setGameState('end');
            // Save Progress
            if (selectedProfileId && score > 0) {
                const starsToAdd = Math.floor(score / 100); // 1 star per 100 points in Arena
                updateProfile(selectedProfileId, {
                    totalScore: (profiles.find(p => p.id === selectedProfileId)?.totalScore || 0) + score,
                    stars: (profiles.find(p => p.id === selectedProfileId)?.stars || 0) + starsToAdd,
                    gamesPlayed: (profiles.find(p => p.id === selectedProfileId)?.gamesPlayed || 0) + 1
                });
            }
        }
    }, [gameState, timeLeft, selectedProfileId, score, profiles]);

    const startGame = () => {
        if (!selectedProfileId) {
            alert("Selecione um jogador primeiro!");
            return;
        }
        setScore(0);
        setStreak(0);
        setTimeLeft(60);
        setGameState('playing');
        generateQuestion();
    };

    const handleAnswer = (answer: string) => {
        if (answer === currentQ.answer) {
            const newStreak = streak + 1;
            const multiplier = Math.min(3, 1 + (newStreak * 0.2));
            setScore(prev => prev + Math.floor(100 * multiplier));
            setStreak(newStreak);
            setFeedback('correct');
            triggerConfetti();
            setTimeout(generateQuestion, 500);
        } else {
            setStreak(0);
            setFeedback('wrong');
            setTimeout(generateQuestion, 800);
        }
    };

    if (gameState === 'start') {
        return (
            <div className={styles.arenaContainer}>
                <div className={styles.startCard}>
                    <h1>⚡ Arena de Velocidade</h1>
                    <p>Quem vai desafiar o cronômetro hoje?</p>

                    <div className={styles.profileSelector}>
                        <label>Escolha o Jogador:</label>
                        <select
                            value={selectedProfileId}
                            onChange={(e) => setSelectedProfileId(e.target.value)}
                            className={styles.select}
                        >
                            <option value="">Selecione...</option>
                            {profiles.map(p => (
                                <option key={p.id} value={p.id}>{p.name} (⭐ {p.stars})</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.bonusInfo}>
                        <span>Acertos seguidos = Super Combo! 🔥</span>
                    </div>

                    <button onClick={startGame} className={styles.startBtn} disabled={!selectedProfileId}>
                        COMEÇAR!
                    </button>
                    <button onClick={() => navigate('/hub')} className={styles.backBtn}>Voltar</button>
                </div>
            </div>
        );
    }

    if (gameState === 'end') {
        const playerName = profiles.find(p => p.id === selectedProfileId)?.name || 'Campeão';
        return (
            <div className={styles.arenaContainer}>
                <div className={styles.endCard}>
                    <h1>Tempo Esgotado! ⏱️</h1>
                    <div className={styles.finalScore}>
                        <span>Mandou bem, {playerName}!</span>
                        <h2>{score} PONTOS</h2>
                        <small>+ {Math.floor(score / 100)} ⭐ Estrelas Coletadas</small>
                    </div>
                    <div className={styles.actions}>
                        <button onClick={startGame} className={styles.retryBtn}>Jogar de Novo</button>
                        <button onClick={() => navigate('/hub')} className={styles.hubBtn}>Voltar ao Portal</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.arenaContainer}>
            <div className={styles.hud}>
                <div className={styles.timer}>⏱️ {timeLeft}s</div>
                <div className={styles.scoreBoard}>
                    <div className={styles.pointLabel}>PONTOS</div>
                    <div className={styles.pointValue}>{score}</div>
                </div>
                {streak >= 2 && <div className={styles.streakBadge}>COMBO x{(1 + (streak * 0.2)).toFixed(1)} 🔥</div>}
            </div>

            {currentQ && (
                <div className={`${styles.questionCard} ${feedback !== 'none' ? styles[feedback] : ''}`}>
                    <div className={styles.questionText}>{currentQ.question}</div>
                    <div className={styles.optionsGrid}>
                        {currentQ.options.map((opt: string, i: number) => (
                            <button key={i} onClick={() => handleAnswer(opt)} className={styles.optionBtn}>
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

