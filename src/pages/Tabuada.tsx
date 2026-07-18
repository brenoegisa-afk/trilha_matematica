import { useState, useEffect, useMemo, useRef, useCallback, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { updateProfile } from '../utils/saveSystem';
import { playSfx } from '../utils/sfx';
import { triggerConfetti } from '../utils/confetti';
import {
    TAB_MIN, TAB_MAX, FAST_MS, totalFacts, factKey, pickFact, registerAnswer,
    masteredCount, type TabuadaMap
} from '../core/learning/TabuadaEngine';
import styles from './Tabuada.module.css';
import { LearningAttemptService } from '../core/services/LearningAttemptService';

export default function Tabuada() {
    const navigate = useNavigate();
    const { players } = useGame();
    const player = players[0];

    const [mastery, setMastery] = useState<TabuadaMap>(() => player?.tabuadaMastery || {});
    const [current, setCurrent] = useState(() => pickFact(player?.tabuadaMastery || {}));
    const [input, setInput] = useState('');
    const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
    const [combo, setCombo] = useState(0);
    const [score, setScore] = useState(0);
    const [toast, setToast] = useState<string | null>(null);
    const shownAt = useRef(Date.now());
    const locked = useRef(false);
    const learningSessionId = useRef(crypto.randomUUID());

    // Sem aluno logado → volta ao setup (login por turma/PIN).
    useEffect(() => {
        if (!player) navigate('/setup', { state: { gameMode: 'tabuada' } });
    }, [player, navigate]);

    const total = totalFacts();
    const mastered = useMemo(() => masteredCount(mastery), [mastery]);

    const rows = useMemo(() => {
        const r: number[] = [];
        for (let i = TAB_MIN; i <= TAB_MAX; i++) r.push(i);
        return r;
    }, []);

    const nextFact = useCallback((m: TabuadaMap, avoid: string) => {
        setCurrent(pickFact(m, avoid));
        setInput('');
        setFeedback('none');
        shownAt.current = Date.now();
        locked.current = false;
    }, []);

    const submit = useCallback(() => {
        if (locked.current || input === '') return;
        locked.current = true;

        const isCorrect = parseInt(input, 10) === current.a * current.b;
        if (player) {
            void LearningAttemptService.record({
                attemptId: crypto.randomUUID(), sessionId: learningSessionId.current,
                studentId: player.id, classId: player.class_id, gameMode: 'tabuada',
                factId: factKey(current.a, current.b), questionRef: factKey(current.a, current.b),
                generatorVersion: 'tabuada-v1', itemFormat: 'multiple_choice', selectedResponse: input,
                isCorrect, responseLatencyMs: Date.now() - shownAt.current,
                attemptNumber: (mastery[factKey(current.a, current.b)]?.attempts || 0) + 1,
                hintCount: 0, supportLevel: 'none', occurredAt: new Date().toISOString()
            });
        }
        const fast = Date.now() - shownAt.current < FAST_MS;
        const { mastery: nextMastery, justMastered } = registerAnswer(
            mastery, current.a, current.b, isCorrect, fast
        );
        setMastery(nextMastery);
        if (player) updateProfile(player.id, { tabuadaMastery: nextMastery });

        const avoid = factKey(current.a, current.b);

        if (isCorrect) {
            setFeedback('correct');
            setCombo(c => c + 1);
            setScore(s => s + (fast ? 20 : 10) + combo * 2);
            if (justMastered) {
                playSfx('levelup');
                triggerConfetti();
                setToast(`✨ ${current.a} × ${current.b} dominado!`);
                setTimeout(() => setToast(null), 1200);
            } else {
                playSfx('correct');
            }
            setTimeout(() => nextFact(nextMastery, avoid), justMastered ? 1000 : 650);
        } else {
            setFeedback('wrong');
            setCombo(0);
            playSfx('wrong');
            setTimeout(() => nextFact(nextMastery, avoid), 1500);
        }
    }, [input, current, mastery, combo, player, nextFact]);

    const press = (d: string) => {
        if (locked.current) return;
        setInput(v => (v + d).slice(0, 3));
    };
    const del = () => { if (!locked.current) setInput(v => v.slice(0, -1)); };

    // Teclado físico (além do teclado na tela)
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key >= '0' && e.key <= '9') press(e.key);
            else if (e.key === 'Backspace') del();
            else if (e.key === 'Enter') submit();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [submit]);

    if (!player) return null;

    const answerClass = feedback === 'correct' ? styles.correct : feedback === 'wrong' ? styles.wrong : '';
    const shownValue = feedback === 'wrong' && input === '' ? '' : input;

    return (
        <div className={styles.wrap}>
            <div className={styles.topbar}>
                <h1 className={styles.title}>✖️ Tabuada</h1>
                <button className={styles.exitBtn} onClick={() => navigate('/hub')}>Sair</button>
            </div>

            <div className={styles.progressCard}>
                <div className={styles.progressTop}>
                    <span>🏆 Coleção da tabuada</span>
                    <span>{mastered}/{total}</span>
                </div>
                <div className={styles.progressTrack}>
                    <div className={styles.progressFill} style={{ width: `${(mastered / total) * 100}%` }} />
                </div>
            </div>

            <div className={styles.playCard}>
                {toast && <div className={styles.toast}>{toast}</div>}

                <div className={styles.statsRow}>
                    <span>⭐ {score}</span>
                    <span className={styles.combo}>🔥 {combo}</span>
                </div>

                <div className={styles.prompt}>{current.a} × {current.b}</div>

                <div className={`${styles.answerBox} ${answerClass}`}>
                    {feedback === 'wrong'
                        ? `${current.a * current.b}`
                        : (shownValue || '?')}
                </div>

                <div className={`${styles.feedbackMsg} ${answerClass}`}>
                    {feedback === 'correct' && 'Isso! 🎉'}
                    {feedback === 'wrong' && `A resposta era ${current.a * current.b}`}
                </div>

                <div className={styles.keypad}>
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
                        <button key={d} className={styles.key} onClick={() => press(d)}>{d}</button>
                    ))}
                    <button className={`${styles.key} ${styles.keyDel}`} onClick={del}>⌫</button>
                    <button className={styles.key} onClick={() => press('0')}>0</button>
                    <button className={`${styles.key} ${styles.keyOk}`} onClick={submit}>OK</button>
                </div>
            </div>

            <div className={styles.gridCard}>
                <p className={styles.gridTitle}>Complete a grade! Cada quadradinho verde é uma tabuada que você já sabe de cor.</p>
                <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${rows.length + 1}, auto)` }}>
                    {/* canto + cabeçalho de colunas */}
                    <div className={`${styles.cell} ${styles.headCell}`}>×</div>
                    {rows.map(b => <div key={`h${b}`} className={`${styles.cell} ${styles.headCell}`}>{b}</div>)}

                    {rows.map(a => (
                        <Fragment key={`row-${a}`}>
                            <div className={`${styles.cell} ${styles.headCell}`}>{a}</div>
                            {rows.map(b => {
                                const f = mastery[factKey(a, b)];
                                const isCurrent = a === current.a && b === current.b;
                                let cls = styles.cell;
                                if (f?.mastered) cls += ` ${styles.cellMastered}`;
                                else if (f && f.score > 0) cls += ` ${styles.cellProgress}`;
                                if (isCurrent) cls += ` ${styles.cellCurrent}`;
                                return (
                                    <div key={`${a}x${b}`} className={cls} title={`${a} × ${b}`}>
                                        {f?.mastered ? '✓' : ''}
                                    </div>
                                );
                            })}
                        </Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
}
