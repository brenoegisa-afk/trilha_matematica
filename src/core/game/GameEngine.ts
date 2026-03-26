import type { Player, GameState, Question, GameStatus, TileType, Mascot } from '../types';
import { BoardEngine } from './BoardEngine';

/**
 * GameEngine — Pure functions for game state management.
 * No internal state — all state lives in Zustand.
 */
export const GameEngine = {
    /**
     * Creates the initial game state for a new game.
     */
    createInitialState(players: Player[]): GameState {
        const board = new BoardEngine();
        return {
            players: players.map(p => ({
                ...p,
                mascots: p.mascots || [],
                hp: p.hp || 100,
                maxHp: p.maxHp || 100
            })),
            currentPlayerIndex: 0,
            tiles: board.getTiles(),
            status: 'playing',
            activeCardType: null,
            activeQuestion: null,
            rolledValue: null,
            answerFeedback: null,
            waitingFeedback: false,
            waitingVictory: null
        };
    },

    /**
     * Rolls a dice and returns the value + updated state.
     */
    rollDice(state: GameState): { state: GameState; value: number } {
        const value = Math.floor(Math.random() * 6) + 1;
        return {
            state: { ...state, rolledValue: value },
            value
        };
    },

    /**
     * Moves the current player by one step towards the destination.
     * Returns new state + whether end/special tile was reached.
     */
    moveOneStep(state: GameState): { state: GameState; reachedEnd: boolean; tileType: string | null } {
        const players = state.players.map((p, i) => {
            if (i !== state.currentPlayerIndex) return p;
            const newPos = p.currentPosition + 1;
            if (newPos >= 35) {
                return { ...p, currentPosition: 35 };
            }
            return { ...p, currentPosition: newPos };
        });

        const currentPlayer = players[state.currentPlayerIndex];

        if (currentPlayer.currentPosition >= 35) {
            return {
                state: { ...state, players, status: 'finished' },
                reachedEnd: true,
                tileType: 'Finish'
            };
        }

        const tile = state.tiles.find(t => t.position === currentPlayer.currentPosition);
        return {
            state: { ...state, players },
            reachedEnd: false,
            tileType: tile?.type || 'Normal'
        };
    },

    /**
     * Finalizes movement after all steps are taken.
     * Triggers card_event for special tiles or advances to next turn.
     */
    finalizeMovement(state: GameState, finalTileType: string): GameState {
        if (state.status === 'finished') return state;

        if (['Green', 'Red', 'Yellow', 'Blue'].includes(finalTileType)) {
            return {
                ...state,
                status: 'card_event',
                activeCardType: finalTileType as TileType
            };
        }

        // Normal tile — advance to next player
        const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
        return { ...state, currentPlayerIndex: nextIndex };
    },

    /**
     * Sets a question on the current state.
     */
    setQuestion(state: GameState, question: Question): GameState {
        return { ...state, activeQuestion: question };
    },

    /**
     * Resolves an answer (correct/wrong).
     */
    resolveAnswer(state: GameState, isCorrect: boolean): GameState {
        return { ...state, answerFeedback: isCorrect ? 'correct' : 'wrong' };
    },

    /**
     * Sets waitingFeedback flag.
     */
    setWaitingFeedback(state: GameState, value: boolean): GameState {
        return { ...state, waitingFeedback: value };
    },

    /**
     * Sets waitingVictory state.
     */
    setWaitingVictory(state: GameState, player: Player, mascot: Mascot): GameState {
        return { ...state, waitingVictory: { player, mascot } };
    },

    /**
     * Clears question-related state.
     */
    clearQuestion(state: GameState): GameState {
        return {
            ...state,
            activeQuestion: null,
            answerFeedback: null,
            waitingFeedback: false,
            waitingVictory: null
        };
    },

    /**
     * Updates game status.
     */
    updateStatus(state: GameState, status: GameStatus): GameState {
        return { ...state, status };
    },

    /**
     * Ends the current turn and advances to the next player.
     */
    endTurn(state: GameState): GameState {
        const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
        return {
            ...state,
            status: 'playing',
            activeCardType: null,
            activeQuestion: null,
            answerFeedback: null,
            waitingFeedback: false,
            rolledValue: null,
            waitingVictory: null,
            currentPlayerIndex: nextIndex
        };
    }
};
