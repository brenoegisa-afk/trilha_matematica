/**
 * TurnEngine — Pure functions for turn management.
 * No internal state — all state lives in Zustand.
 */
export const TurnEngine = {
    nextPlayer(currentIndex: number, playerCount: number): number {
        return (currentIndex + 1) % playerCount;
    }
};
