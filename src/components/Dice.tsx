import { useState, useCallback, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import styles from './Dice.module.css';

// Dot patterns for each face (3x3 grid positions)
const DOT_PATTERNS: Record<number, boolean[]> = {
    1: [false,false,false, false,true,false, false,false,false],
    2: [false,false,true, false,false,false, true,false,false],
    3: [false,false,true, false,true,false, true,false,false],
    4: [true,false,true, false,false,false, true,false,true],
    5: [true,false,true, false,true,false, true,false,true],
    6: [true,false,true, true,false,true, true,false,true],
};

function DiceFace({ value }: { value: number }) {
    const pattern = DOT_PATTERNS[value] || DOT_PATTERNS[1];
    return (
        <div className={styles.dotGrid}>
            {pattern.map((hasDot, i) => (
                <div key={i} className={hasDot ? styles.dot : styles.dotEmpty} />
            ))}
        </div>
    );
}

export default function Dice() {
    const { rollDice, players, currentPlayerIndex, activeQuestion, gameStatus } = useGame();
    const [isRolling, setIsRolling] = useState(false);
    const [currentFace, setCurrentFace] = useState(1);

    const currentPlayer = players[currentPlayerIndex];

    // Auto-reset when question appears or game state changes
    useEffect(() => {
        if (activeQuestion || gameStatus !== 'playing') {
            setIsRolling(false);
        }
    }, [activeQuestion, gameStatus]);

    const handleRoll = useCallback(() => {
        console.log('Dice: Tentativa de clique no dado', { isRolling, playersCount: players.length, gameStatus });
        
        if (isRolling || players.length === 0 || gameStatus !== 'playing') {
            console.warn('Dice: Clique ignorado', { isRolling, gameStatus });
            return;
        }

        setIsRolling(true);

        let count = 0;
        const quickShuffle = setInterval(() => {
            setCurrentFace(Math.floor(Math.random() * 6) + 1);
            count++;
            if (count > 6) clearInterval(quickShuffle);
        }, 80);

        setTimeout(() => {
            try {
                clearInterval(quickShuffle);
                const finalValue = rollDice();
                setCurrentFace(finalValue);
                setIsRolling(false);
            } catch (err) {
                console.error('Dice: Erro ao rolar', err);
                setIsRolling(false);
            }
        }, 1200);
    }, [isRolling, players.length, gameStatus, rollDice]);

    const showClass = `show${currentFace}`;

    return (
        <div className={styles.diceContainer}>
            {players.length > 0 && (
                <div className={styles.turnIndicator}>
                    Vez de: <strong style={{ color: currentPlayer.color }}>{currentPlayer.name}</strong>
                    <div className={styles.playerMiniInfo}>
                        <span>{currentPlayer.avatar}</span>
                        <span>Lv.{currentPlayer.level}</span>
                    </div>
                </div>
            )}

            <div className={styles.rollActionGroup}>
                <div
                    className={`${styles.scene} ${isRolling || players.length === 0 ? styles.disabled : ''}`}
                    onClick={handleRoll}
                    role="button"
                    aria-label="Rolar dado"
                >
                    <div className={`${styles.cube} ${isRolling ? styles.rolling : ''} ${!isRolling ? styles[showClass] : ''}`}>
                        <div className={`${styles.face} ${styles.face1}`}><DiceFace value={1} /></div>
                        <div className={`${styles.face} ${styles.face2}`}><DiceFace value={2} /></div>
                        <div className={`${styles.face} ${styles.face3}`}><DiceFace value={3} /></div>
                        <div className={`${styles.face} ${styles.face4}`}><DiceFace value={4} /></div>
                        <div className={`${styles.face} ${styles.face5}`}><DiceFace value={5} /></div>
                        <div className={`${styles.face} ${styles.face6}`}><DiceFace value={6} /></div>
                    </div>
                    <div className={`${styles.shadow} ${isRolling ? styles.shadowBouncing : ''}`} />
                </div>
                
                <p className={styles.rollStatus}>
                    {isRolling ? '🎲 BORA!' : 'ROLE O DADO'}
                </p>
            </div>
        </div>
    );
}
