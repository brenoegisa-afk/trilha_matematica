export class TurnEngine {
    private currentPlayerIndex: number = 0;
    private playerCount: number = 0;

    constructor(playerCount: number) {
        this.playerCount = playerCount;
    }

    public get current(): number {
        return this.currentPlayerIndex;
    }

    public next(): number {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.playerCount;
        return this.currentPlayerIndex;
    }

    public reset(): void {
        this.currentPlayerIndex = 0;
    }

    public setPlayerCount(count: number): void {
        this.playerCount = count;
    }
}
