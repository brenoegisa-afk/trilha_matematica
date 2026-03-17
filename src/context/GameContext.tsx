import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../utils/supabaseClient';
import { getOrCreateProfile, getSavedProfiles, saveProfiles, getGlobalRanking } from '../utils/saveSystem';
import { useGameEngine } from '../hooks/useGameEngine';
import type { Player, Tile, TileType, GameStatus, Question, Enemy, Subject } from '../core/types';

interface GameContextProps {
    players: Player[];
    currentUser: any | null;
    currentPlayerIndex: number;
    tiles: Tile[];
    gameStatus: GameStatus;
    activeCardType: TileType | null;
    activeQuestion: Question | null;
    selectedGrade: string;
    rolledValue: number | null;
    answerFeedback: 'correct' | 'wrong' | null;
    currentEnemy: Enemy | null;
    gameState: any;
    currentSubjectId: string;
    availableSubjects: Subject[];
    levelUpData: { playerName: string, oldLevel: number, newLevel: number } | null;
    xpNotification: { amount: number } | null;

    setGrade: (grade: string) => void;
    addPlayer: (name: string, color: string, code?: string, classId?: string) => import('../utils/saveSystem').SaveProfile;
    startGame: () => void;
    rollDice: () => number;
    submitAnswer: (answer: string) => void;
    refreshPlayers: () => void;
    startBattle: () => void;
    setSubject: (id: string) => void;
    clearLevelUp: () => void;
    clearXpNotification: () => void;
    logout: () => void;
    actions: any;
}

const GameContext = createContext<GameContextProps | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
    const [players, setPlayers] = useState<Player[]>([]);
    const [selectedGrade, setSelectedGrade] = useState<string>('1-2');
    const [currentUser, setCurrentUser] = useState<any>(null);
    
    const engine = useGameEngine(players, selectedGrade);
    const { gameState, actions, currentEnemy, currentSubjectId, setSubject, availableSubjects } = engine;

    // Monitor Auth Changes
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setCurrentUser(session?.user ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setCurrentUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const setGrade = (grade: string) => {
        setSelectedGrade(grade);
    };

    const refreshPlayers = () => {
        setPlayers(prev => prev.map(p => {
            const profile = getOrCreateProfile(p.name);
            return {
                ...p,
                avatar: profile.equippedAvatar,
                mascot: profile.equippedMascot,
                streak: profile.streak || 0
            };
        }));
    };

    const addPlayer = (name: string, color: string, code: string = '0000', classId: string = '') => {
        const profile = getOrCreateProfile(name, code);

        // Link with current user if logged in
        if (currentUser && !profile.user_id) {
            import('../utils/saveSystem').then(m => m.updateProfile(profile.id, { user_id: currentUser.id }));
            profile.user_id = currentUser.id;
        }

        if (players.some(p => p.id === profile.id)) {
            alert(`${name} já está na fila!`);
            return profile;
        }

        if (classId) {
            import('../utils/saveSystem').then(m => m.updateProfile(profile.id, { class_id: classId }));
            profile.class_id = classId;
        }

        const newPlayer: Player = {
            id: profile.id,
            name: profile.name,
            color,
            avatar: profile.equippedAvatar,
            mascot: profile.equippedMascot,
            streak: profile.streak || 1,
            class_id: profile.class_id || classId,
            user_id: profile.user_id || currentUser?.id,
            currentPosition: 0,
            inventoryProtectionCount: 0,
            score: 0,
            level: 1,
            xp: 0,
            achievements: [],
            hp: 100,
            maxHp: 100,
            mascots: [],
            skillsMastery: []
        };

        setPlayers(prev => [...prev, newPlayer]);
        return profile;
    };

    const startGame = async () => {
        const ranking = await getGlobalRanking();

        setPlayers(prev => prev.map(p => {
            const rankIndex = ranking.findIndex((r: any) => r.name === p.name);
            if (rankIndex !== -1 && rankIndex < 3) {
                return { ...p, globalRank: rankIndex + 1 };
            }
            return p;
        }));

        actions.start(players);
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setPlayers([]);
    };

    const handleRollDice = () => {
        const val = actions.rollDice();
        return val;
    };

    useEffect(() => {
        if (gameState.activeCardType && !gameState.activeQuestion) {
            if (['Red', 'Yellow'].includes(gameState.activeCardType) && gameState.status === 'card_event') {
                actions.startBattle();
                actions.generateQuestion(gameState.activeCardType);
            } else {
                actions.generateQuestion(gameState.activeCardType);
            }
        }
    }, [gameState.activeCardType, gameState.activeQuestion, gameState.status, actions]);

    useEffect(() => {
        if (gameState.status === 'finished') {
            gameState.players.forEach((p) => {
                const finalScore = p.score;
                const starsToAdd = Math.floor(finalScore / 10);

                const allProfiles = getSavedProfiles();
                const profIdx = allProfiles.findIndex((prof: any) => prof.id === p.id);
                if (profIdx !== -1) {
                    allProfiles[profIdx].gamesPlayed += 1;
                    allProfiles[profIdx].totalScore = (allProfiles[profIdx].totalScore || 0) + finalScore;
                    allProfiles[profIdx].stars += starsToAdd;
                    saveProfiles(allProfiles);
                }
            });
        }
    }, [gameState.status, gameState.players]);

    return (
        <GameContext.Provider value={{
            players: gameState.players.length > 0 ? gameState.players : players,
            currentUser,
            currentPlayerIndex: gameState.currentPlayerIndex,
            tiles: gameState.tiles,
            gameStatus: gameState.status,
            activeCardType: gameState.activeCardType,
            activeQuestion: gameState.activeQuestion,
            selectedGrade,
            rolledValue: gameState.rolledValue,
            answerFeedback: gameState.answerFeedback,
            setGrade,
            addPlayer,
            startGame,
            rollDice: handleRollDice,
            submitAnswer: actions.submitAnswer,
            refreshPlayers,
            startBattle: actions.startBattle,
            currentEnemy,
            gameState,
            currentSubjectId,
            setSubject,
            availableSubjects,
            levelUpData: engine.levelUpData,
            xpNotification: engine.xpNotification,
            clearLevelUp: engine.clearLevelUp,
            clearXpNotification: engine.clearXpNotification,
            logout,
            actions
        }}>
            {children}
        </GameContext.Provider>
    );
}

export const useGame = () => {
    const ctx = useContext(GameContext);
    if (!ctx) throw new Error('useGame must be used within GameProvider');
    return ctx;
};
