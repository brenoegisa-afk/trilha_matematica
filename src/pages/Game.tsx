import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Board from '../components/Board';
import HUD from '../components/HUD';
import BattleArena from '../components/BattleArena';
import CardModal from '../components/CardModal';
import GameOverScreen from '../components/GameOverScreen';
import { useGame } from '../context/GameContext';
import LevelUpModal from '../components/LevelUpModal';
import FloatingXP from '../components/FloatingXP';
import VictoryModal from '../components/VictoryModal';
import '../App.css';

export default function Game() {
    const navigate = useNavigate();
    const { 
        players, 
        gameStatus, 
        levelUpData, 
        xpNotification, 
        clearLevelUp, 
        clearXpNotification 
    } = useGame();

    // Redirect to setup if NO players exist
    useEffect(() => {
        if (players.length === 0 && gameStatus !== 'playing' && gameStatus !== 'card_event') {
            navigate('/setup');
        }
    }, [players.length, gameStatus, navigate]);

    return (
        <div className="app-container" style={{ justifyContent: 'flex-start', paddingTop: '10px', position: 'relative' }}>
            <header style={{ width: '100%', maxWidth: '850px', display: 'flex', justifyContent: 'flex-end', padding: '0 15px', marginBottom: '5px' }}>
                <button className="btn-danger" onClick={() => navigate('/')} style={{ padding: '4px 10px', fontSize: '0.85rem' }}>Sair</button>
            </header>

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <HUD />
                <Board />
            </main>

            <BattleArena />
            <CardModal />
            <GameOverScreen />
            <VictoryModal />

            {/* Cinematic Level Up */}
            {levelUpData && (
                <LevelUpModal 
                    playerName={levelUpData.playerName}
                    oldLevel={levelUpData.oldLevel}
                    newLevel={levelUpData.newLevel}
                    onClose={clearLevelUp}
                />
            )}

            {/* Numerical Feedback */}
            {xpNotification && (
                <FloatingXP 
                    amount={xpNotification.amount}
                    x={window.innerWidth / 2 - 50}
                    y={window.innerHeight / 2 - 100}
                    onComplete={clearXpNotification}
                />
            )}
        </div>
    );
}
