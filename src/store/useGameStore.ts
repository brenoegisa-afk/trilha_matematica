import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';
import { triggerConfetti } from '../utils/confetti';
import { getOrCreateProfile, getGlobalRanking, getSavedProfiles } from '../utils/saveSystem';
import type { SaveProfile } from '../utils/saveSystem';

import { GameEngine } from '../core/game/GameEngine';
import { SkillEngine } from '../core/game/SkillEngine';
import { SubjectService } from '../core/game/SubjectService';
import { XPEngine } from '../core/gamification/XPEngine';
import { StreakEngine } from '../core/gamification/StreakEngine';
import { AchievementEngine } from '../core/gamification/AchievementEngine';
import { BattleEngine } from '../core/game/BattleEngine';
import { MascotEngine } from '../core/game/MascotEngine';
import { SessionService } from '../core/game/SessionService';

import type { Player, Tile, TileType, GameStatus, Question, Enemy, Subject, GameState, Mascot } from '../core/types';

// Singleton Engines
const gameEngine = new GameEngine([]);
const skillEngine = new SkillEngine();
const subjectService = new SubjectService();
const xpEngine = new XPEngine();
const streakEngine = new StreakEngine();
const achievementEngine = new AchievementEngine();
const battleEngine = new BattleEngine();
const mascotEngine = new MascotEngine();

const AVAILABLE_SUBJECTS = [
    { id: 'math', name: 'Matemática', icon: '🔢', description: 'Desafios de números e lógica' },
    { id: 'portuguese', name: 'Português', icon: '📚', description: 'Rimas, letras e histórias' },
    { id: 'science', name: 'Ciências', icon: '🔬', description: 'Descobertas sobre o mundo e a vida' }
];

interface GameStoreState {
    // --- Application State ---
    players: Player[];
    currentUser: any | null;
    selectedGrade: string;
    currentSubjectId: string;
    availableSubjects: Subject[];
    
    // --- Engine State Mirrors ---
    gameState: GameState;
    currentPlayerIndex: number;
    tiles: Tile[];
    gameStatus: GameStatus;
    activeCardType: TileType | null;
    activeQuestion: Question | null;
    rolledValue: number | null;
    answerFeedback: 'correct' | 'wrong' | null;
    waitingVictory: { player: Player, mascot: any } | null;
    isSavingSessions: boolean;
    
    // --- Sub-Systems State ---
    currentEnemy: Enemy | null;
    levelUpData: { playerName: string, oldLevel: number, newLevel: number } | null;
    xpNotification: { amount: number } | null;
    
    // --- Actions ---
    setGrade: (grade: string) => void;
    setSubject: (id: string) => void;
    setCurrentUser: (user: any | null) => void;
    refreshPlayers: () => void;
    addPlayer: (name: string, color: string, code?: string, classId?: string) => any;
    startGame: () => void;
    rollDice: () => number;
    submitAnswer: (answer: string) => void;
    acknowledgeFeedback: () => void;
    acknowledgeVictory: () => void;
    startBattle: () => void;
    clearLevelUp: () => void;
    clearXpNotification: () => void;
    logout: () => void;
    actions: any; // Compatibility export
}

export const useGameStore = create<GameStoreState>((set, get) => {
    // Helper to sync engine state to Zustand
    const syncEngine = () => {
        const state = gameEngine.getState();
        set({
            gameState: { ...state },
            players: state.players.length > 0 ? state.players : get().players,
            currentPlayerIndex: state.currentPlayerIndex,
            tiles: state.tiles,
            gameStatus: state.status,
            activeCardType: state.activeCardType,
            activeQuestion: state.activeQuestion,
            rolledValue: state.rolledValue,
            answerFeedback: state.answerFeedback,
            waitingVictory: state.waitingVictory
        });

        // Trigger session saving when game finishes
        if (state.status === 'finished' && !get().isSavingSessions) {
            set({ isSavingSessions: true });
            const playersToSave = state.players;
            
            (async () => {
                console.log("💾 Salvando sessões pedagógicas...");
                for (const player of playersToSave) {
                    await SessionService.saveSession(player);
                }
                console.log("✅ Sessões salvas com sucesso.");
                // We keep isSavingSessions true for the rest of the finished state
            })();
        }
    };

    // Subsystem logic extracted from hooks
    const applyXP = (player: Player, activeTileType: TileType | string, isCorrect: boolean, streak: number) => {
        if (!isCorrect) return;
        const oldLevel = player.level;
        const baseXP = xpEngine.calculateXP(activeTileType as any, true, streak);
        const mascotBonus = mascotEngine.calculateXPBonus(player, baseXP);
        const xpGained = baseXP + mascotBonus;
        
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
                    // Trigger a celebratory state
                    set({ waitingVictory: { player, mascot: m } });
                }
            });
        }
    };

    const advanceTurn = (isCorrect: boolean) => {
        const currentState = gameEngine.getState();
        const player = currentState.players[currentState.currentPlayerIndex];
        const activeTileType = currentState.activeCardType || 'Normal';
        
        player.streak = streakEngine.calculateNewStreak(isCorrect, player.streak);
        applyXP(player, activeTileType, isCorrect, player.streak);
        
        // Update Session Stats
        player.sessionStats.totalQuestions += 1;
        if (isCorrect) player.sessionStats.correctAnswers += 1;
        
        if (currentState.activeQuestion?.skillId) {
            const skillId = currentState.activeQuestion.skillId;
            if (!player.sessionStats.skillsPracticed[skillId]) {
                player.sessionStats.skillsPracticed[skillId] = { attempts: 0, successes: 0 };
            }
            player.sessionStats.skillsPracticed[skillId].attempts += 1;
            if (isCorrect) player.sessionStats.skillsPracticed[skillId].successes += 1;

            skillEngine.updateMastery(player, skillId, isCorrect);
        }

        if (currentState.status === 'battle') {
            const { currentEnemy } = get();
            if (currentEnemy) {
                if (isCorrect) {
                    const dmgMult = mascotEngine.getDamageMultiplier(player);
                    const damage = Math.floor(battleEngine.calculateDamage(true, player.streak) * dmgMult);
                    battleEngine.applyDamageToEnemy(damage);
                    set({ currentEnemy: { ...battleEngine.getCurrentEnemy()! } });
                    
                    if (battleEngine.isEnemyDefeated()) {
                        // For now, reward a random base mascot if they win a battle
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
                        battleEngine.resetPlayerHp(player);
                        battleEngine.endBattle();
                        set({ currentEnemy: null });
                        gameEngine.setWaitingVictory(player, newMascot);
                        syncEngine();
                        return; // Wait for victory modal
                    } else {
                        gameEngine.clearQuestion();
                        const nextQ = subjectService.getQuestion(get().currentSubjectId, get().selectedGrade, activeTileType as TileType, player);
                        gameEngine.setQuestion(nextQ);
                    }
                } else {
                    battleEngine.applyDamageToPlayer(player);
                    if (battleEngine.isPlayerDefeated(player)) {
                        battleEngine.resetPlayerHp(player);
                        battleEngine.endBattle();
                        set({ currentEnemy: null });
                        gameEngine.endTurn();
                    } else {
                        gameEngine.clearQuestion();
                        const nextQ = subjectService.getQuestion(get().currentSubjectId, get().selectedGrade, activeTileType as TileType, player);
                        gameEngine.setQuestion(nextQ);
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
                        // Mascot protection is passive and doesn't consume charges
                    } else {
                        player.currentPosition = Math.max(0, player.currentPosition - 1);
                    }
                }
            } else if (activeTileType === 'Blue' && isCorrect) {
                player.inventoryProtectionCount += 1;
            }

            const newMedals = achievementEngine.checkNewAchievements(player);
            if (newMedals.length > 0) player.achievements.push(...newMedals);

            gameEngine.endTurn();
        }
        syncEngine();
    };

    const actionsAPI = {
        rollDice: () => {
            try {
                // Ensure engine has latest players before rolling
                gameEngine.start(get().players);
                const value = gameEngine.rollDice();
                syncEngine();
                
                (async () => {
                    try {
                        for (let i = 0; i < value; i++) {
                            await new Promise(resolve => setTimeout(resolve, 300));
                            const { reachedEnd, tileType } = gameEngine.moveOneStep();
                            syncEngine();
                            if (reachedEnd) break;
                            if (i === value - 1) {
                                gameEngine.finalizeMovement(tileType || 'Normal');
                                syncEngine();
                                if (tileType && !gameEngine.getState().activeQuestion) {
                                    if (['Red', 'Yellow'].includes(tileType) && gameEngine.getState().status === 'card_event') {
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
                        gameEngine.endTurn();
                        syncEngine();
                    }
                })();
                return value;
            } catch (err) {
                console.error("Erro ao rolar dado:", err);
                return 1;
            }
        },
        submitAnswer: (answer: string) => {
            const state = gameEngine.getState();
            if (!state.activeQuestion) return;
            const isCorrect = answer === state.activeQuestion.answer;
            gameEngine.resolveAnswer(isCorrect);
            syncEngine();
            
            if (isCorrect) {
                triggerConfetti();
                setTimeout(() => advanceTurn(true), 1500);
            } else {
                gameEngine.setWaitingFeedback(true);
                syncEngine();
            }
        },
        acknowledgeFeedback: () => {
            gameEngine.setWaitingFeedback(false);
            advanceTurn(false);
        },
        acknowledgeVictory: () => {
            gameEngine.endTurn();
            syncEngine();
        },
        startBattle: () => {
            const state = gameEngine.getState();
            const player = state.players[state.currentPlayerIndex];
            const enemy = battleEngine.generateEnemy(player.level, get().currentSubjectId);
            set({ currentEnemy: enemy });
            gameEngine.updateStatus('battle');
            syncEngine();
        },
        generateQuestion: (type: TileType) => {
            const player = gameEngine.getState().players[gameEngine.getState().currentPlayerIndex];
            const nextQ = subjectService.getQuestion(get().currentSubjectId, get().selectedGrade, type, player);
            gameEngine.setQuestion(nextQ);
            syncEngine();
        },
        start: async (pls?: Player[]) => {
            gameEngine.start(pls || get().players);
            syncEngine();
        }
    };

    return {
        // Init State
        players: [],
        currentUser: null,
        selectedGrade: '1-2',
        currentSubjectId: 'math',
        availableSubjects: AVAILABLE_SUBJECTS,
        gameState: gameEngine.getState(),
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
                    // Sync cloud profiles to local storage indirectly by updating the local profiles array
                    const profiles = getSavedProfiles();
                    data.forEach((cloudP: any) => {
                        const idx = profiles.findIndex(p => p.id === cloudP.id);
                        const mapped: SaveProfile = {
                            id: cloudP.id,
                            name: cloudP.name,
                            secretCode: cloudP.secret_code,
                            stars: cloudP.stars,
                            equippedAvatar: cloudP.equipped_avatar,
                            unlockedAvatars: cloudP.unlocked_avatars,
                            gamesPlayed: cloudP.games_played,
                            totalScore: cloudP.total_score,
                            equippedMascot: cloudP.equipped_mascot,
                            unlockedMascots: cloudP.unlocked_mascots,
                            streak: cloudP.streak,
                            class_id: cloudP.class_id,
                            user_id: cloudP.user_id
                        };
                        if (idx !== -1) {
                            profiles[idx] = mapped;
                        } else {
                            profiles.push(mapped);
                        }
                    });
                    // saveProfiles is imported indirectly via saveSystem but I'll use the store logic
                    localStorage.setItem('@TrilhaCampeoes:Profiles', JSON.stringify(profiles));
                }
            }
            
            set((state) => ({
                players: state.players.map((p: Player) => {
                    const profile = getOrCreateProfile(p.name, p.id ? undefined : '0000'); // ID-aware check
                    return { 
                        ...p, 
                        avatar: profile.equippedAvatar, 
                        mascot: profile.equippedMascot, 
                        streak: profile.streak || 0,
                        score: profile.totalScore,
                        level: profile.stars > 100 ? Math.floor(profile.stars / 100) + 1 : 1 // Dynamic level Calc
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
                const rankIndex = ranking.findIndex((r: any) => r.name === p.name);
                if (rankIndex !== -1 && rankIndex < 3) return { ...p, globalRank: rankIndex + 1 };
                return p;
            });
            gameEngine.start(sortedPlayers);
            syncEngine();
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
        actions: actionsAPI
    };
});
