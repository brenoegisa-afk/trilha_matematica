import { useState } from 'react';
import { useGame } from '../context/GameContext';
import styles from './Dice.module.css';

export default function Dice() {
    const { rollDice, players, currentPlayerIndex } = useGame();
    const [isRolling, setIsRolling] = useState(false);
    const [currentFace, setCurrentFace] = useState(1);

    const currentPlayer = players[currentPlayerIndex];

    const handleRoll = () => {
        if (isRolling || players.length === 0) return;

        setIsRolling(true);
        // Animação falsa de rolagem
        let rolls = 0;
        const interval = setInterval(() => {
            setCurrentFace(Math.floor(Math.random() * 6) + 1);
            rolls++;
            if (rolls > 10) {
                clearInterval(interval);
                const finalValue = rollDice();
                setCurrentFace(finalValue);
                setIsRolling(false);
            }
        }, 100);
    };

    return (
        <div className={styles.diceContainer}>
            {players.length > 0 && (
                <div className={styles.turnIndicator}>
                    Vez de: <strong style={{ color: currentPlayer.color }}>{currentPlayer.name}</strong>
                </div>
            )}

            <button
                className={`${styles.dice} ${isRolling ? styles.rolling : ''}`}
                onClick={handleRoll}
                disabled={isRolling || players.length === 0}
            >
                {currentFace}
            </button>

            <p style={{ marginTop: '10px', fontSize: '0.9rem', opacity: 0.8 }}>Clique no dado para rolar</p>
        </div>
    );
}
