import type { Player, GameState, Question, GameStatus } from '../types';
import { BoardEngine } from './BoardEngine';
import { TurnEngine } from './TurnEngine';

export class GameEngine {
    private state: GameState;
    private board: BoardEngine;
    private turns: TurnEngine;

    constructor(players: Player[]) {
        this.board = new BoardEngine();
        this.turns = new TurnEngine(players.length);
        this.state = {
            players,
            currentPlayerIndex: 0,
            tiles: this.board.getTiles(),
            status: 'setup',
            activeCardType: null,
            activeQuestion: null,
            rolledValue: null,
            answerFeedback: null,
            waitingFeedback: false,
            waitingVictory: null
        };
    }

    public getState(): GameState {
        return { ...this.state };
    }

    public start(players?: Player[]): void {
        if (players) {
            this.state.players = players.map(p => ({
                ...p,
                mascots: p.mascots || [],
                hp: p.hp || 100,
                maxHp: p.maxHp || 100
            }));
            this.turns.setPlayerCount(this.state.players.length);
        }
        this.state.status = 'playing';
        this.turns.reset();
        this.state.currentPlayerIndex = 0;
    }

    public rollDice(): number {
        const value = Math.floor(Math.random() * 6) + 1;
        this.state.rolledValue = value;
        return value;
    }

    /**
     * Moves the current player by one step towards the destination.
     * Returns true if the player reached the end or a special tile.
     */
    public moveOneStep(): { reachedEnd: boolean, tileType: string | null } {
        const player = this.state.players[this.state.currentPlayerIndex];
        player.currentPosition += 1;

        if (player.currentPosition >= 35) {
            player.currentPosition = 35;
            this.state.status = 'finished';
            return { reachedEnd: true, tileType: 'Finish' };
        }

        const tile = this.board.getTileAt(player.currentPosition);
        return { reachedEnd: false, tileType: tile?.type || 'Normal' };
    }

    public finalizeMovement(finalTileType: string): void {
        if (this.state.status === 'finished') return;

        if (['Green', 'Red', 'Yellow', 'Blue'].includes(finalTileType)) {
            this.state.status = 'card_event';
            this.state.activeCardType = finalTileType as any;
        } else {
            this.state.currentPlayerIndex = this.turns.next();
        }
    }

    public setQuestion(question: Question): void {
        this.state.activeQuestion = question;
    }

    public resolveAnswer(isCorrect: boolean): void {
        this.state.answerFeedback = isCorrect ? 'correct' : 'wrong';
        // Post-answer logic will be handled by the caller/orchestrator to allow for animations
    }

    public setWaitingFeedback(value: boolean): void {
        this.state.waitingFeedback = value;
    }

    public setWaitingVictory(player: Player, mascot: any): void {
        this.state.waitingVictory = { player, mascot };
    }

    public clearQuestion(): void {
        this.state.activeQuestion = null;
        this.state.answerFeedback = null;
        this.state.waitingFeedback = false;
        this.state.waitingVictory = null;
    }

    public updateStatus(status: GameStatus): void {
        this.state.status = status;
    }

    public endTurn(): void {
        this.state.status = 'playing';
        this.state.activeCardType = null;
        this.state.activeQuestion = null;
        this.state.answerFeedback = null;
        this.state.waitingFeedback = false;
        this.state.rolledValue = null;
        this.state.waitingVictory = null;
        this.state.currentPlayerIndex = this.turns.next();
    }
}
