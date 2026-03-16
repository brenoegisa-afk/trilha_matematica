import { useState, useCallback, useRef } from 'react';
import { GameEngine } from '../core/game/GameEngine';
import { SkillEngine } from '../core/game/SkillEngine';
import { SubjectService } from '../core/game/SubjectService';
import { XPEngine } from '../core/gamification/XPEngine';
import { StreakEngine } from '../core/gamification/StreakEngine';
import { AchievementEngine } from '../core/gamification/AchievementEngine';
import { BattleEngine } from '../core/game/BattleEngine';
import { MascotEngine } from '../core/game/MascotEngine';
import type { Player, GameState, TileType, Enemy } from '../core/types';
import { triggerConfetti } from '../utils/confetti';

export function useGameEngine(initialPlayers: Player[], selectedGrade: string) {
    const engineRef = useRef<GameEngine>(new GameEngine(initialPlayers));
    const skillEngineRef = useRef<SkillEngine>(new SkillEngine());
    const subjectServiceRef = useRef<SubjectService>(new SubjectService());
    const xpEngineRef = useRef<XPEngine>(new XPEngine());
    const streakEngineRef = useRef<StreakEngine>(new StreakEngine());
    const achievementEngineRef = useRef<AchievementEngine>(new AchievementEngine());
    const battleEngineRef = useRef<BattleEngine>(new BattleEngine());
    const mascotEngineRef = useRef<MascotEngine>(new MascotEngine());
    
    const [gameState, setGameState] = useState<GameState>(engineRef.current.getState());
    const [currentEnemy, setCurrentEnemy] = useState<Enemy | null>(null);
    const [currentSubjectId, setCurrentSubjectId] = useState<string>('math');
    const [levelUpData, setLevelUpData] = useState<{ playerName: string, oldLevel: number, newLevel: number } | null>(null);
    const [xpNotification, setXpNotification] = useState<{ amount: number } | null>(null);

    const updateState = useCallback(() => {
        setGameState(engineRef.current.getState());
    }, []);

    const rollDice = useCallback(() => {
        const value = engineRef.current.rollDice();
        updateState();

        // 🎲 Fire walking animation in the background (non-blocking)
        (async () => {
            for (let i = 0; i < value; i++) {
                await new Promise(resolve => setTimeout(resolve, 300));
                const { reachedEnd, tileType } = engineRef.current.moveOneStep();
                updateState();
                
                if (reachedEnd) break;
                
                if (i === value - 1) {
                    engineRef.current.finalizeMovement(tileType || 'Normal');
                    updateState();
                }
            }
        })();

        return value;
    }, [updateState]);

    const submitAnswer = useCallback((answer: string) => {
        const state = engineRef.current.getState();
        if (!state.activeQuestion) return;

        const isCorrect = answer === state.activeQuestion.answer;
        engineRef.current.resolveAnswer(isCorrect);
        if (isCorrect) triggerConfetti();
        updateState();

        // Delayed Turn Resolution
        setTimeout(() => {
            const currentState = engineRef.current.getState();
            const player = currentState.players[currentState.currentPlayerIndex];
            const activeTileType = currentState.activeCardType || 'Normal';
            
            // 1. Calculate Streak
            player.streak = streakEngineRef.current.calculateNewStreak(isCorrect, player.streak);

            // 2. Calculate XP & Level
            if (isCorrect) {
                const oldLevel = player.level;
                const baseXP = xpEngineRef.current.calculateXP(activeTileType, true, player.streak);
                const mascotBonus = mascotEngineRef.current.calculateXPBonus(player, baseXP);
                const xpGained = baseXP + mascotBonus;
                
                player.score += xpGained;
                player.xp += xpGained;
                const newLevel = xpEngineRef.current.calculateLevel(player.xp);
                player.level = newLevel;

                setXpNotification({ amount: xpGained });

                if (newLevel > oldLevel) {
                    setLevelUpData({
                        playerName: player.name,
                        oldLevel: oldLevel,
                        newLevel: newLevel
                    });
                }
            }

            // 2.1 Update Skill Mastery
            if (currentState.activeQuestion?.skillId) {
                skillEngineRef.current.updateMastery(player, currentState.activeQuestion.skillId, isCorrect);
            }

            // 2.5 Battle Resolution
            if (currentState.status === 'battle' && isCorrect) {
                const damageBonus = mascotEngineRef.current.getDamageBonus(player);
                const damage = battleEngineRef.current.calculateDamage(true, player.streak) + damageBonus;
                battleEngineRef.current.applyDamageToEnemy(damage);
                
                if (battleEngineRef.current.isEnemyDefeated()) {
                    const reward = mascotEngineRef.current.getRandomMascot();
                    mascotEngineRef.current.addMascotToPlayer(player, reward);
                    battleEngineRef.current.endBattle();
                    setCurrentEnemy(null);
                    engineRef.current.endTurn();
                    triggerConfetti();
                } else {
                    engineRef.current.clearQuestion();
                }
            } else if (currentState.status === 'battle' && !isCorrect) {
                // If wrong answer during battle, also clear to continue
                engineRef.current.clearQuestion();
            } else {
                // 3. Resolve Special Tile Movement
                if (activeTileType === 'Green' && isCorrect) {
                    player.currentPosition = Math.min(35, player.currentPosition + 1);
                } else if (activeTileType === 'Red') {
                    if (isCorrect) {
                        player.currentPosition = Math.min(35, player.currentPosition + 2);
                    } else {
                        const protection = mascotEngineRef.current.getProtectionBonus(player);
                        if (player.inventoryProtectionCount > 0 || protection > 0) {
                            if (player.inventoryProtectionCount > 0) player.inventoryProtectionCount -= 1;
                        } else {
                            player.currentPosition = Math.max(0, player.currentPosition - 1);
                        }
                    }
                } else if (activeTileType === 'Blue' && isCorrect) {
                    player.inventoryProtectionCount += 1;
                }

                // 4. Check for New Achievements
                const newMedals = achievementEngineRef.current.checkNewAchievements(player);
                if (newMedals.length > 0) {
                    player.achievements.push(...newMedals);
                }

                // 5. Finalize Turn
                engineRef.current.endTurn();
            }

            updateState();
        }, 1500);
    }, [updateState]);

    const startBattle = useCallback(() => {
        const state = engineRef.current.getState();
        const player = state.players[state.currentPlayerIndex];
        const enemy = battleEngineRef.current.generateEnemy(player.level, currentSubjectId);
        setCurrentEnemy(enemy);
        
        // Update state to battle mode
        engineRef.current.updateStatus('battle');
        updateState();
    }, [updateState]);

    const generateQuestion = useCallback((type: TileType) => {
        const nextQ = subjectServiceRef.current.getQuestion(
            currentSubjectId,
            selectedGrade,
            type
        );
        engineRef.current.setQuestion(nextQ);
        updateState();
    }, [currentSubjectId, selectedGrade, updateState]);

    return {
        gameState,
        currentEnemy,
        currentSubjectId,
        levelUpData,
        xpNotification,
        clearLevelUp: () => setLevelUpData(null),
        clearXpNotification: () => setXpNotification(null),
        setSubject: setCurrentSubjectId,
        availableSubjects: [
            { id: 'math', name: 'Matemática', icon: '🔢', description: 'Desafios de números e lógica' },
            { id: 'portuguese', name: 'Português', icon: '📚', description: 'Rimas, letras e histórias' },
            { id: 'science', name: 'Ciências', icon: '🔬', description: 'Descontas sobre o mundo e a vida' }
        ],
        actions: {
            rollDice,
            submitAnswer,
            generateQuestion,
            startBattle,
            start: (players?: Player[]) => {
                engineRef.current.start(players || initialPlayers);
                updateState();
            }
        }
    };
}
