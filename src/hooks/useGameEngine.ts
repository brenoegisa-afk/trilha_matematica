import { useState, useCallback, useRef } from 'react';
import { GameEngine } from '../core/game/GameEngine';
import { SkillEngine } from '../core/game/SkillEngine';
import { SubjectService } from '../core/game/SubjectService';
import { XPEngine } from '../core/gamification/XPEngine';
import { StreakEngine } from '../core/gamification/StreakEngine';
import { AchievementEngine } from '../core/gamification/AchievementEngine';
import { BattleEngine } from '../core/game/BattleEngine';
import { MascotEngine } from '../core/game/MascotEngine';
import type { Player, GameState, TileType } from '../core/types';
import { triggerConfetti } from '../utils/confetti';

// Import sub-hooks
import { useProgression } from './game/useProgression';
import { useBattleSystem } from './game/useBattleSystem';

export function useGameEngine(initialPlayers: Player[], selectedGrade: string) {
    const engineRef = useRef<GameEngine>(new GameEngine(initialPlayers));
    const skillEngineRef = useRef<SkillEngine>(new SkillEngine());
    const subjectServiceRef = useRef<SubjectService>(new SubjectService());
    
    // Core Gamification Engines
    const xpEngineRef = useRef<XPEngine>(new XPEngine());
    const streakEngineRef = useRef<StreakEngine>(new StreakEngine());
    const achievementEngineRef = useRef<AchievementEngine>(new AchievementEngine());
    
    // Battle & Mascot Engines
    const battleEngineRef = useRef<BattleEngine>(new BattleEngine());
    const mascotEngineRef = useRef<MascotEngine>(new MascotEngine());
    
    const [gameState, setGameState] = useState<GameState>(engineRef.current.getState());
    const [currentSubjectId, setCurrentSubjectId] = useState<string>('math');

    // --- Sub-Systems Integration ---
    const progression = useProgression(xpEngineRef.current, mascotEngineRef.current);
    const battleSystem = useBattleSystem(battleEngineRef.current, mascotEngineRef.current);

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

            // 2. Delegate to Progression Hook (XP & Level)
            progression.applyXP(player, activeTileType, isCorrect, player.streak);

            // 3. Update Skill Mastery
            if (currentState.activeQuestion?.skillId) {
                skillEngineRef.current.updateMastery(player, currentState.activeQuestion.skillId, isCorrect);
            }

            // 4. Battle Resolution
            if (currentState.status === 'battle') {
                const { battleEnded } = battleSystem.resolveBattleTurn(player, isCorrect);
                
                if (battleEnded) {
                    engineRef.current.endTurn();
                    triggerConfetti();
                } else {
                    engineRef.current.clearQuestion();
                }
            } else {
                // 5. Resolve Special Tile Movement
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

                // 6. Check for New Achievements
                const newMedals = achievementEngineRef.current.checkNewAchievements(player);
                if (newMedals.length > 0) {
                    player.achievements.push(...newMedals);
                }

                // 7. Finalize Turn
                engineRef.current.endTurn();
            }

            updateState();
        }, 1500);
    }, [updateState, progression, battleSystem]);

    const startBattle = useCallback(() => {
        const state = engineRef.current.getState();
        const player = state.players[state.currentPlayerIndex];
        
        // Delegate to Battle System
        battleSystem.initBattle(player, currentSubjectId);
        
        // Update core engine state to battle mode
        engineRef.current.updateStatus('battle');
        updateState();
    }, [updateState, battleSystem, currentSubjectId]);

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
        currentEnemy: battleSystem.currentEnemy,
        currentSubjectId,
        levelUpData: progression.levelUpData,
        xpNotification: progression.xpNotification,
        clearLevelUp: progression.clearLevelUp,
        clearXpNotification: progression.clearXpNotification,
        setSubject: setCurrentSubjectId,
        availableSubjects: [
            { id: 'math', name: 'Matemática', icon: '🔢', description: 'Desafios de números e lógica' },
            { id: 'portuguese', name: 'Português', icon: '📚', description: 'Rimas, letras e histórias' },
            { id: 'science', name: 'Ciências', icon: '🔬', description: 'Descobertas sobre o mundo e a vida' }
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
