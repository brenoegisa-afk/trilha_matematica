import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import questionsData from '../data/questions.json';
import { getOrCreateProfile, getSavedProfiles, saveProfiles, getGlobalRanking } from '../utils/saveSystem';

export type TileType = 'Normal' | 'Green' | 'Red' | 'Yellow' | 'Blue' | 'Start' | 'Finish';

export interface Tile {
    position: number; // 0 to 35 (or 1 to 36 visually)
    type: TileType;
}

export interface Player {
    id: string;      // maps to save profile id
    name: string;
    color: string; // 'red', 'blue', 'green', 'yellow'
    avatar: string; // cosmetic emoji/icon
    currentPosition: number;
    inventoryProtectionCount: number;
    score: number;
    globalRank?: number; // 1, 2 or 3
}

export interface Question {
    question: string;
    answer: string;
    options: string[];
}

interface GameContextProps {
    players: Player[];
    currentPlayerIndex: number;
    tiles: Tile[];
    gameStatus: 'setup' | 'playing' | 'card_event' | 'finished';
    activeCardType: TileType | null;
    activeQuestion: Question | null;
    selectedGrade: string;

    setGrade: (grade: string) => void;
    addPlayer: (name: string, color: string, code?: string) => void;
    startGame: () => void;
    rollDice: () => number;
    submitAnswer: (answer: string) => void;
    rolledValue: number | null;
    answerFeedback: 'correct' | 'wrong' | null;
    refreshPlayers: () => void;
}

const generateTiles = (): Tile[] => {
    const tiles: Tile[] = [];

    // Fill exactly 34 slots with active events
    const specialTileCounts = {
        'Green': 10,   // + bonus (Adição)
        'Red': 10,     // - penalty (Desafio Rápido)
        'Yellow': 9,   // ? logic (Raciocínio)
        'Blue': 5      // ★ item (Proteção)
    };

    // Create an array of special tiles to scatter
    const scatterPool: TileType[] = [];
    Object.entries(specialTileCounts).forEach(([type, count]) => {
        for (let i = 0; i < count; i++) scatterPool.push(type as TileType);
    });

    // Shuffle scatter pool
    for (let i = scatterPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [scatterPool[i], scatterPool[j]] = [scatterPool[j], scatterPool[i]];
    }

    for (let i = 0; i < 36; i++) {
        if (i === 0) {
            tiles.push({ position: i, type: 'Start' });
            continue;
        }
        if (i === 35) {
            tiles.push({ position: i, type: 'Finish' });
            continue;
        }

        // Pop a tile from the pool for every slot
        const type = scatterPool.pop() || 'Green'; // fallback just in case
        tiles.push({ position: i, type });
    }

    return tiles;
};

const GameContext = createContext<GameContextProps | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
    const [players, setPlayers] = useState<Player[]>([]);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [gameStatus, setGameStatus] = useState<'setup' | 'playing' | 'card_event' | 'finished'>('setup');
    const [activeCardType, setActiveCardType] = useState<TileType | null>(null);
    const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
    const [answerFeedback, setAnswerFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [rolledValue, setRolledValue] = useState<number | null>(null);
    const [tiles] = useState<Tile[]>(generateTiles());
    const [selectedGrade, setSelectedGrade] = useState<string>('1-2');

    const setGrade = (grade: string) => {
        setSelectedGrade(grade);
    };

    const refreshPlayers = () => {
        setPlayers(prev => prev.map(p => {
            const profile = getOrCreateProfile(p.name);
            return {
                ...p,
                avatar: profile.equippedAvatar
            };
        }));
    };

    const addPlayer = (name: string, color: string, code: string = '0000') => {
        const profile = getOrCreateProfile(name, code);

        setPlayers(prev => [
            ...prev,
            {
                id: profile.id,
                name: profile.name,
                color,
                avatar: profile.equippedAvatar,
                currentPosition: 0,
                inventoryProtectionCount: 0,
                score: 0
            }
        ]);
    };

    const startGame = async () => {
        // Fetch ranking to see if anyone is a "Champion"
        const ranking = await getGlobalRanking();

        setPlayers(prev => prev.map(p => {
            const rankIndex = ranking.findIndex((r: any) => r.name === p.name);
            // Global rank is only relevant if you are top 3
            if (rankIndex !== -1 && rankIndex < 3) {
                return { ...p, globalRank: rankIndex + 1 };
            }
            return p;
        }));

        setGameStatus('playing');
        setCurrentPlayerIndex(0);
    };

    const rollDice = () => {
        const value = Math.floor(Math.random() * 6) + 1;
        setRolledValue(value);

        // Calculate new position using the synchronous state
        let newPosition = players[currentPlayerIndex].currentPosition + value;
        if (newPosition >= 35) {
            newPosition = 35; // Finish line
        }

        const tile = tiles.find(t => t.position === newPosition);
        const landedTileType: TileType = tile ? tile.type : 'Normal';

        setPlayers(prev => {
            const newPlayers = [...prev];
            const player = { ...newPlayers[currentPlayerIndex] };

            player.currentPosition = newPosition;
            newPlayers[currentPlayerIndex] = player;

            return newPlayers;
        });

        // Determine next steps based on calculated position
        if (newPosition >= 35) {
            setGameStatus('finished');
        } else if (['Green', 'Red', 'Yellow', 'Blue'].includes(landedTileType)) {
            triggerCardEvent(landedTileType);
        } else {
            setCurrentPlayerIndex(prev => (prev + 1) % players.length);
        }

        return value;
    };

    const triggerCardEvent = (type: TileType) => {
        setActiveCardType(type);
        setGameStatus('card_event');

        let questionsArray: Question[] = [];
        const allGrades = questionsData.grades as Record<string, Record<string, Question[]>>;

        // Catch-Up Mechanic: If player is >6 tiles behind the leader, they get easier questions
        const leaderPosition = Math.max(...players.map(p => p.currentPosition));
        const currentPlayerPosition = players[currentPlayerIndex].currentPosition;
        const isLaggingBehind = (leaderPosition - currentPlayerPosition) > 6;

        let gradeToUse = selectedGrade;
        if (isLaggingBehind && selectedGrade !== '1-2') {
            gradeToUse = '1-2'; // Force easiest questions for struggling player
        }

        // Cumulative logic: 5th grade gets everything, 3-4 gets 1-2 + 3-4, 1-2 gets only 1-2.
        if (gradeToUse === '5') {
            const pools = [allGrades['1-2'], allGrades['3-4'], allGrades['5']];
            pools.forEach(pool => { if (pool && pool[type]) questionsArray.push(...pool[type]) });
        } else if (gradeToUse === '3-4') {
            const pools = [allGrades['1-2'], allGrades['3-4']];
            pools.forEach(pool => { if (pool && pool[type]) questionsArray.push(...pool[type]) });
        } else {
            if (allGrades['1-2'] && allGrades['1-2'][type]) {
                questionsArray = [...allGrades['1-2'][type]];
            }
        }

        // Fallback safely if something is missing
        if (questionsArray.length > 0) {
            const randomQ = questionsArray[Math.floor(Math.random() * questionsArray.length)];
            setActiveQuestion(randomQ);
        } else if (type === 'Blue') {
            // Blue is special item
            setActiveQuestion({
                question: "Você ganhou uma PROTEÇÃO! Pode usá-la para evitar voltar casas caso erre uma próxima pergunta perigosa.",
                answer: "OK",
                options: ["Legal, Coletar!"]
            });
        } else {
            // Fallback fallback
            setActiveQuestion({
                question: "Curinga! Role novamente na próxima rodada.",
                answer: "OK",
                options: ["OK"]
            });
        }
    };

    // Web Audio API helper for 8-bit sounds
    const playSound = (type: 'correct' | 'wrong') => {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'correct') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
        } else {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
        }
    };

    const submitAnswer = (answer: string) => {
        if (answerFeedback) return; // Prevent double clicking

        const isCorrect = answer === activeQuestion?.answer;
        setAnswerFeedback(isCorrect ? 'correct' : 'wrong');
        playSound(isCorrect ? 'correct' : 'wrong');

        // Delay state updates to allow animation and sound to play
        setTimeout(() => {
            let newPosition = players[currentPlayerIndex].currentPosition;
            let newItemCount = players[currentPlayerIndex].inventoryProtectionCount;
            let newScore = players[currentPlayerIndex].score;
            let nextIndex = (currentPlayerIndex + 1) % players.length;

            // Apply rewards / penalties purely functionally
            if (activeCardType === 'Green') {
                if (isCorrect) {
                    newPosition = Math.min(35, newPosition + 1);
                    newScore += 50; // Points for basic addition
                }
            } else if (activeCardType === 'Red') {
                if (isCorrect) {
                    newPosition = Math.min(35, newPosition + 2);
                    newScore += 100; // Big points for hard challenge
                } else {
                    newPosition = Math.max(0, newPosition - 1);
                    // If the player has a protection item, ask to use it? 
                    // For now, auto-use protection if they have it
                    if (newItemCount > 0) {
                        newItemCount -= 1;
                        newPosition = players[currentPlayerIndex].currentPosition; // undo penalty
                    }
                }
            } else if (activeCardType === 'Yellow') {
                if (isCorrect) {
                    nextIndex = currentPlayerIndex; // play again
                    newScore += 30; // Points for logic
                }
            } else if (activeCardType === 'Blue') {
                newItemCount += 1;
                newScore += 20; // Points for collecting item
            }

            // Finish line bonus
            if (newPosition >= 35 && players[currentPlayerIndex].currentPosition < 35) {
                newScore += 200;
            }

            setPlayers(prev => {
                const newPlayers = [...prev];
                const player = { ...newPlayers[currentPlayerIndex] };
                player.currentPosition = newPosition;
                player.inventoryProtectionCount = newItemCount;
                player.score = newScore;
                newPlayers[currentPlayerIndex] = player;
                return newPlayers;
            });


            // Reset state and pass turn
            setActiveCardType(null);
            setActiveQuestion(null);
            setAnswerFeedback(null);

            if (newPosition >= 35) {
                setGameStatus('finished');

                // SAVE METAGAME PROGRESS
                players.forEach((p, idx) => {
                    const finalScore = idx === currentPlayerIndex ? newScore : p.score;
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
            } else {
                setGameStatus('playing');
                setCurrentPlayerIndex(nextIndex);
            }
        }, 1500); // 1.5 seconds delay for feedback
    };

    return (
        <GameContext.Provider value={{
            players, currentPlayerIndex, tiles, gameStatus, activeCardType, activeQuestion, selectedGrade, rolledValue, answerFeedback,
            setGrade, addPlayer, startGame, rollDice, submitAnswer, refreshPlayers
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
