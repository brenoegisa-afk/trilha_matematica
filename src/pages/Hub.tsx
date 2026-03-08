import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Hub.module.css';

export default function Hub() {
    const navigate = useNavigate();

    const games = [
        {
            id: 'trilha',
            title: 'Trilha dos Campeões',
            description: 'A jornada clássica pelo tabuleiro matemático.',
            icon: '🎲',
            active: true,
            color: 'var(--color-green)'
        },
        {
            id: 'arena',
            title: 'Arena de Velocidade',
            description: 'Responda rápido para vencer o tempo!',
            icon: '⚡',
            active: true,
            color: 'var(--color-blue)'
        },

        {
            id: 'battle',
            title: 'Batalha de Mascotes',
            description: 'Treine seus mascotes com o poder da matemática.',
            icon: '🐾',
            active: true,
            color: 'var(--color-red)'
        }
    ];

    return (
        <div className={styles.hubContainer}>
            <header className={styles.header}>
                <h1>Portal dos Campeões</h1>
                <p>Escolha seu desafio de hoje!</p>
            </header>

            <div className={styles.gameGrid}>
                {games.map((game) => (
                    <div
                        key={game.id}
                        className={`${styles.gameCard} ${!game.active ? styles.inactive : ''}`}
                        onClick={() => game.active && navigate('/setup', { state: { gameMode: game.id } })}
                        style={{ '--accent-color': game.color } as React.CSSProperties}
                    >
                        <div className={styles.cardIcon}>{game.icon}</div>
                        <h3>{game.title}</h3>
                        <p>{game.description}</p>
                        <button disabled={!game.active} className={styles.playBtn}>
                            {game.active ? 'Jogar Agora' : 'Em Breve'}
                        </button>
                    </div>
                ))}
            </div>

            <footer className={styles.footer}>
                <button onClick={() => navigate('/teacher/login')} className={styles.teacherBtn}>
                    🔓 Painel do Professor
                </button>
            </footer>

        </div>
    );
}
