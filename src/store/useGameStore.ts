import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';
import { triggerConfetti } from '../utils/confetti';
import { getOrCreateProfile, getGlobalRanking, getSavedProfiles } from '../utils/saveSystem';
import type { SaveProfile } from '../utils/saveSystem';
import type { User } from '@supabase/supabase-js';

// Pure function engines — no internal state
import { GameEngine } from '../core/game/GameEngine';
import { SkillEngine } from '../core/game/SkillEngine';
import { SubjectService } from '../core/game/SubjectService';
import { XPEngine } from '../core/gamification/XPEngine';
import { StreakEngine } from '../core/gamification/StreakEngine';
import { AchievementEngine } from '../core/gamification/AchievementEngine';
import { BattleEngine } from '../core/game/BattleEngine';
import { MascotEngine } from '../core/game/MascotEngine';
import { SessionService } from '../core/game/SessionService';
import { ReinforcementEngine } from '../core/learning/ReinforcementEngine';

import type { Player, Tile, TileType, GameStatus, Question, Enemy, Subject, GameState, Mascot } from '../core/types';

// Stateful engines that still need instances (contain data catalogs, not game state)
const skillEngine = new SkillEngine();
const subjectService = new SubjectService();
const xpEngine = new XPEngine();
const streakEngine = new StreakEngine();
const achievementEngine = new AchievementEngine();
const mascotEngine = new MascotEngine();

const AVAILABLE_SUBJECTS: Subject[] = [
    { id: 'math', name: 'Matemática', icon: '🔢', description: 'Desafios de números e lógica' },
    { id: 'portuguese', name: 'Português', icon: '📚', description: 'Rimas, letras e histórias' },
    { id: 'science', name: 'Ciências', icon: '🔬', description: 'Descobertas sobre o mundo e a vida' }
];

const EMPTY_GAME_STATE: GameState = {
    players: [],
    currentPlayerIndex: 0,
    tiles: [],
    status: 'setup',
    activeCardType: null,
    activeQuestion: null,
    rolledValue: null,
    answerFeedback: null,
    waitingFeedback: false,
    waitingVictory: null
};

interface GameStoreState {
    // --- Application State ---
    players: Player[];
    currentUser: User | null;
    selectedGrade: string;
    currentSubjectId: string;
    availableSubjects: Subject[];
    
    // --- Game State (single source of truth) ---
    gameState: GameState;
    currentPlayerIndex: number;
    tiles: Tile[];
    gameStatus: GameStatus;
    activeCardType: TileType | null;
    activeQuestion: Question | null;
    rolledValue: number | null;
    answerFeedback: 'correct' | 'wrong' | null;
    waitingVictory: { player: Player, mascot: Mascot } | null;
    isSavingSessions: boolean;
    
    // --- Sub-Systems State ---
    currentEnemy: Enemy | null;
    levelUpData: { playerName: string, oldLevel: number, newLevel: number } | null;
    xpNotification: { amount: number } | null;
    
    // --- Actions ---
    setGrade: (grade: string) => void;
    setSubject: (id: string) => void;
    setCurrentUser: (user: User | null) => void;
    refreshPlayers: () => void;
    addPlayer: (name: string, color: string, code?: string, classId?: string) => SaveProfile;
    startGame: () => void;
    rollDice: () => number;
    submitAnswer: (answer: string) => void;
    acknowledgeFeedback: () => void;
    acknowledgeVictory: () => void;
    startBattle: () => void;
    clearLevelUp: () => void;
    clearXpNotification: () => void;
    logout: () => void;
    actions: {
        rollDice: () => number;
        submitAnswer: (answer: string) => void;
        acknowledgeFeedback: () => void;
        acknowledgeVictory: () => void;
        startBattle: () => void;
        startReinforcement: () => void;
        generateQuestion: (type: TileType) => void;
        start: (players?: Player[]) => void;
    };
}

/**
 * Helper: apply GameState to the flat store fields (backward compatibility).
 * Components read both `gameState.X` and top-level `X` — we keep both in sync.
 */
function flattenGameState(gs: GameState) {
    return {
        gameState: gs,
        players: gs.players.length > 0 ? gs.players : undefined,
        currentPlayerIndex: gs.currentPlayerIndex,
        tiles: gs.tiles,
        gameStatus: gs.status,
        activeCardType: gs.activeCardType,
        activeQuestion: gs.activeQuestion,
        rolledValue: gs.rolledValue,
        answerFeedback: gs.answerFeedback,
        waitingVictory: gs.waitingVictory
    };
}

export const useGameStore = create<GameStoreState>((set, get) => {
    /**
     * Update game state using a pure engine function.
     * Replaces the old syncEngine() pattern.
     */
    const updateGame = (newGameState: GameState) => {
        const flat = flattenGameState(newGameState);
        set({
            ...flat,
            players: flat.players || get().players
        });

        // Trigger session saving when game finishes
        if (newGameState.status === 'finished' && !get().isSavingSessions) {
            set({ isSavingSessions: true });
            const playersToSave = newGameState.players;
            
            (async () => {
                console.log("💾 Salvando sessões pedagógicas...");
                for (const player of playersToSave) {
                    await SessionService.saveSession(player);
                }
                console.log("✅ Sessões salvas com sucesso.");
            })();
        }
    };

    // Subsystem logic
    const applyXP = (player: Player, activeTileType: TileType | string, isCorrect: boolean, streak: number) => {
        if (!isCorrect) return;
        const oldLevel = player.level;
        const baseXP = xpEngine.calculateXP(activeTileType as TileType, true, streak);
        const mascotBonus = mascotEngine.calculateXPBonus(player, baseXP);
        let xpGained = baseXP + mascotBonus;
        
        // Halve XP if this was a reinforcement question
        if (get().gameState.activeQuestion?.isReinforcement) {
            xpGained = Math.floor(xpGained / 2);
        }
        
        player.score += xpGained;
        player.xp += xpGained;
        const newLevel = xpEngine.calculateLevel(player.xp);
        player.level = newLevel;

        set({ xpNotification: { amount: xpGained } });
        if (newLevel > oldLevel) {
            set({ levelUpData: { playerName: player.name, oldLevel, newLevel } });
            
            // Check for Mascot Evolutions on Level Up
            player.mascots.forEach(m => {
                const nextStage = mascotEngine.checkEvolution(player, m.id);
                if (nextStage) {
                    m.id = nextStage.id;
                    m.name = nextStage.name;
                    m.icon = nextStage.icon;
                    const gs = get().gameState;
                    updateGame(GameEngine.setWaitingVictory(gs, player, m));
                }
            });
        }
    };

    const advanceTurn = (isCorrect: boolean) => {
        const gs = get().gameState;
        const player = gs.players[gs.currentPlayerIndex];
        const activeTileType = gs.activeCardType || 'Normal';
        
        player.streak = streakEngine.calculateNewStreak(isCorrect, player.streak);
        applyXP(player, activeTileType, isCorrect, player.streak);
        
        // Update Session Stats
        player.sessionStats.totalQuestions += 1;
        if (isCorrect) player.sessionStats.correctAnswers += 1;
        
        if (gs.activeQuestion?.skillId) {
            const skillId = gs.activeQuestion.skillId;
            if (!player.sessionStats.skillsPracticed[skillId]) {
                player.sessionStats.skillsPracticed[skillId] = { attempts: 0, successes: 0 };
            }
            player.sessionStats.skillsPracticed[skillId].attempts += 1;
            if (isCorrect) player.sessionStats.skillsPracticed[skillId].successes += 1;

            skillEngine.updateMastery(player, skillId, isCorrect);
        }

        if (gs.status === 'battle') {
            const { currentEnemy } = get();
            if (currentEnemy) {
                if (isCorrect) {
                    const dmgMult = mascotEngine.getDamageMultiplier(player);
                    const damage = Math.floor(BattleEngine.calculateDamage(true, player.streak) * dmgMult);
                    const updatedEnemy = BattleEngine.applyDamageToEnemy(currentEnemy, damage);
                    set({ currentEnemy: updatedEnemy });
                    
                    if (BattleEngine.isEnemyDefeated(updatedEnemy)) {
                        const available = mascotEngine.getAvailableBaseMascots();
                        const rewardArchetype = available[Math.floor(Math.random() * available.length)];
                        const newMascot: Mascot = {
                            id: rewardArchetype.id,
                            name: rewardArchetype.name,
                            icon: rewardArchetype.icon,
                            equipped: false,
                            xp: 0,
                            level: 1
                        };
                        mascotEngine.addMascotToPlayer(player, newMascot);
                        const resetPlayer = BattleEngine.resetPlayerHp(player);
                        // Apply HP reset to the game state player
                        player.hp = resetPlayer.hp;
                        set({ currentEnemy: null });
                        updateGame(GameEngine.setWaitingVictory(gs, player, newMascot));
                        return; // Wait for victory modal
                    } else {
                        let cleared = GameEngine.clearQuestion(gs);
                        const nextQ = subjectService.getQuestion(get().currentSubjectId, get().selectedGrade, activeTileType as TileType, player);
                        cleared = GameEngine.setQuestion(cleared, nextQ);
                        updateGame(cleared);
                    }
                } else {
                    const damagedPlayer = BattleEngine.applyDamageToPlayer(player);
                    player.hp = damagedPlayer.hp;
                    
                    if (BattleEngine.isPlayerDefeated(player)) {
                        const resetPlayer = BattleEngine.resetPlayerHp(player);
                        player.hp = resetPlayer.hp;
                        set({ currentEnemy: null });
                        updateGame(GameEngine.endTurn(gs));
                    } else {
                        let cleared = GameEngine.clearQuestion(gs);
                        const nextQ = subjectService.getQuestion(get().currentSubjectId, get().selectedGrade, activeTileType as TileType, player);
                        cleared = GameEngine.setQuestion(cleared, nextQ);
                        updateGame(cleared);
                    }
                }
            }
        } else {
            if (activeTileType === 'Green' && isCorrect) {
                player.currentPosition = Math.min(35, player.currentPosition + 1);
            } else if (activeTileType === 'Red') {
                if (isCorrect) {
                    player.currentPosition = Math.min(35, player.currentPosition + 2);
                } else {
                    const mascotProtection = mascotEngine.shouldProtect(player);
                    const armorProtection = player.inventoryProtectionCount > 0;
                    
                    if (mascotProtection || armorProtection) {
                        if (armorProtection && !mascotProtection) {
                            player.inventoryProtectionCount -= 1;
                        }
                    } else {
                        player.currentPosition = Math.max(0, player.currentPosition - 1);
                    }
                }
            } else if (activeTileType === 'Blue' && isCorrect) {
                player.inventoryProtectionCount += 1;
            }

            const newMedals = achievementEngine.checkNewAchievements(player);
            if (newMedals.length > 0) player.achievements.push(...newMedals);

            updateGame(GameEngine.endTurn(gs));
        }
    };

    const actionsAPI = {
        rollDice: () => {
            try {
                const gs = get().gameState;
                // Guard: only roll if game is in playing state
                if (gs.status !== 'playing') {
                    console.warn("rollDice chamado fora do estado 'playing':", gs.status);
                    return 1;
                }

                const { state: rolledState, value } = GameEngine.rollDice(gs);
                updateGame(rolledState);
                
                (async () => {
                    try {
                        let currentState = get().gameState;
                        for (let i = 0; i < value; i++) {
                            await new Promise(resolve => setTimeout(resolve, 300));
                            const { state: movedState, reachedEnd, tileType } = GameEngine.moveOneStep(currentState);
                            currentState = movedState;
                            updateGame(currentState);
                            if (reachedEnd) break;
                            if (i === value - 1) {
                                currentState = GameEngine.finalizeMovement(currentState, tileType || 'Normal');
                                updateGame(currentState);
                                if (tileType && !currentState.activeQuestion) {
                                    if (['Red', 'Yellow'].includes(tileType) && currentState.status === 'card_event') {
                                        actionsAPI.startBattle();
                                        actionsAPI.generateQuestion(tileType as TileType);
                                    } else {
                                        actionsAPI.generateQuestion(tileType as TileType);
                                    }
                                }
                            }
                        }
                    } catch (loopErr) {
                        console.error("Erro no loop de movimento:", loopErr);
                        updateGame(GameEngine.endTurn(get().gameState));
                    }
                })();
                return value;
            } catch (err) {
                console.error("Erro ao rolar dado:", err);
                return 1;
            }
        },
        submitAnswer: (answer: string) => {
            const gs = get().gameState;
            if (!gs.activeQuestion) return;
            const isCorrect = answer === gs.activeQuestion.answer;
            let newState = GameEngine.resolveAnswer(gs, isCorrect);
            updateGame(newState);
            
            if (isCorrect) {
                triggerConfetti();
                setTimeout(() => advanceTurn(true), 1500);
            } else {
                newState = GameEngine.setWaitingFeedback(newState, true);
                updateGame(newState);
            }
        },
        acknowledgeFeedback: () => {
            const gs = get().gameState;
            updateGame(GameEngine.setWaitingFeedback(gs, false));
            advanceTurn(false);
        },
        acknowledgeVictory: () => {
            updateGame(GameEngine.endTurn(get().gameState));
        },
        startBattle: () => {
            const gs = get().gameState;
            const player = gs.players[gs.currentPlayerIndex];
            const enemy = BattleEngine.generateEnemy(player.level, get().currentSubjectId);
            set({ currentEnemy: enemy });
            updateGame(GameEngine.updateStatus(gs, 'battle'));
        },
        startReinforcement: () => {
            const gs = get().gameState;
            if (!gs.activeQuestion) return;
            const player = gs.players[gs.currentPlayerIndex];
            const activeTileType = gs.activeCardType || 'Normal';
            
            const reinforcementQ = ReinforcementEngine.generateReinforcement(
                gs.activeQuestion, 
                player, 
                get().currentSubjectId, 
                get().selectedGrade, 
                activeTileType as TileType
            );
            
            let newState = GameEngine.setWaitingFeedback(gs, false);
            newState = { ...newState, answerFeedback: null, activeQuestion: reinforcementQ };
            updateGame(newState);
        },
        generateQuestion: (type: TileType) => {
            const gs = get().gameState;
            const player = gs.players[gs.currentPlayerIndex];
            const nextQ = subjectService.getQuestion(get().currentSubjectId, get().selectedGrade, type, player);
            updateGame(GameEngine.setQuestion(gs, nextQ));
        },
        start: (pls?: Player[]) => {
            const newState = GameEngine.createInitialState(pls || get().players);
            updateGame(newState);
        }
    };

    return {
        // Init State
        players: [],
        currentUser: null,
        selectedGrade: '1-2',
        currentSubjectId: 'math',
        availableSubjects: AVAILABLE_SUBJECTS,
        gameState: { ...EMPTY_GAME_STATE },
        currentPlayerIndex: 0,
        tiles: [],
        gameStatus: 'setup',
        activeCardType: null,
        activeQuestion: null,
        rolledValue: null,
        answerFeedback: null,
        waitingVictory: null,
        currentEnemy: null,
        levelUpData: null,
        xpNotification: null,
        isSavingSessions: false,

        // Setters
        setGrade: (grade) => set({ selectedGrade: grade }),
        setSubject: (id) => set({ currentSubjectId: id }),
        setCurrentUser: (user) => set({ currentUser: user }),
        clearLevelUp: () => set({ levelUpData: null }),
        clearXpNotification: () => set({ xpNotification: null }),

        refreshPlayers: async () => {
            const { currentUser } = get();
            if (currentUser) {
                const { data } = await supabase.from('profiles').select('*').eq('user_id', currentUser.id);
                if (data) {
                    const profiles = getSavedProfiles();
                    data.forEach((cloudP: Record<string, unknown>) => {
                        const idx = profiles.findIndex(p => p.id === cloudP.id);
                        const mapped: SaveProfile = {
                            id: cloudP.id as string,
                            name: cloudP.name as string,
                            secretCode: cloudP.secret_code as string,
                            stars: cloudP.stars as number,
                            equippedAvatar: cloudP.equipped_avatar as string,
                            unlockedAvatars: cloudP.unlocked_avatars as string[],
                            gamesPlayed: cloudP.games_played as number,
                            totalScore: cloudP.total_score as number,
                            equippedMascot: cloudP.equipped_mascot as string,
                            unlockedMascots: cloudP.unlocked_mascots as string[],
                            streak: cloudP.streak as number,
                            class_id: cloudP.class_id as string,
                            user_id: cloudP.user_id as string
                        };
                        if (idx !== -1) {
                            profiles[idx] = mapped;
                        } else {
                            profiles.push(mapped);
                        }
                    });
                    localStorage.setItem('@TrilhaCampeoes:Profiles', JSON.stringify(profiles));
                }
            }
            
            set((state) => ({
                players: state.players.map((p: Player) => {
                    const profile = getOrCreateProfile(p.name, p.id ? undefined : '0000');
                    return { 
                        ...p, 
                        avatar: profile.equippedAvatar, 
                        mascot: profile.equippedMascot, 
                        streak: profile.streak || 0,
                        score: profile.totalScore,
                        level: profile.stars > 100 ? Math.floor(profile.stars / 100) + 1 : 1
                    };
                })
            }));
        },

        addPlayer: (name, color, code = '0000', classId = '') => {
            const profile = getOrCreateProfile(name, code);
            const { players, currentUser } = get();
            
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
                id: profile.id, name: profile.name, color, avatar: profile.equippedAvatar,
                mascot: profile.equippedMascot, streak: profile.streak || 1, class_id: profile.class_id || classId,
                user_id: profile.user_id || currentUser?.id, currentPosition: 0, inventoryProtectionCount: 0,
                score: 0, level: 1, xp: 0, achievements: [], hp: 100, maxHp: 100, mascots: [], skillsMastery: [],
                sessionStats: { totalQuestions: 0, correctAnswers: 0, skillsPracticed: {} }
            };
            set({ players: [...players, newPlayer] });
            return profile;
        },

        startGame: async () => {
            const ranking = await getGlobalRanking();
            const { players } = get();
            const sortedPlayers = players.map(p => {
                const rankIndex = ranking.findIndex((r: { name: string }) => r.name === p.name);
                if (rankIndex !== -1 && rankIndex < 3) return { ...p, globalRank: rankIndex + 1 };
                return p;
            });
            const newState = GameEngine.createInitialState(sortedPlayers);
            updateGame(newState);
        },

        logout: async () => {
            await supabase.auth.signOut();
            set({ players: [] });
        },

        // Export Actions Flat & in .actions
        rollDice: actionsAPI.rollDice,
        submitAnswer: actionsAPI.submitAnswer,
        acknowledgeFeedback: actionsAPI.acknowledgeFeedback,
        acknowledgeVictory: actionsAPI.acknowledgeVictory,
        startBattle: actionsAPI.startBattle,
        startReinforcement: actionsAPI.startReinforcement,
        actions: actionsAPI
    };
});
