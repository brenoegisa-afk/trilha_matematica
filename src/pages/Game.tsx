import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Board from '../components/Board';
import Dice from '../components/Dice';
import CardModal from '../components/CardModal';
import GameOverScreen from '../components/GameOverScreen';
import { useGame } from '../context/GameContext';
import '../App.css';

export default function Game() {
    const navigate = useNavigate();
    const { players, gameStatus } = useGame();

    // Redirect to setup if NO players exist
    useEffect(() => {
        if (players.length === 0 && gameStatus !== 'playing' && gameStatus !== 'card_event') {
            navigate('/setup');
        }
    }, [players.length, gameStatus, navigate]);

    return (
        <div className="app-container" style={{ justifyContent: 'flex-start', paddingTop: '20px', position: 'relative' }}>
            <header style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h2 style={{ fontSize: '1.5rem' }}>A Grande Trilha</h2>
                <button className="btn-danger" onClick={() => navigate('/')} style={{ padding: '6px 12px', fontSize: '1rem' }}>Sair</button>
            </header>

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <Board />
                <Dice />
            </main>

            <CardModal />
            <GameOverScreen />
        </div>
    );
}
