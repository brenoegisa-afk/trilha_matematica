export class StreakEngine {
    constructor() {}

    public calculateNewStreak(isCorrect: boolean, currentStreak: number): number {
        if (isCorrect) {
            return currentStreak + 1;
        }
        return 0; // Reset streak on error
    }

    public getStreakBonusMultiplier(streak: number): number {
        if (streak >= 10) return 2.0;
        if (streak >= 7) return 1.5;
        if (streak >= 3) return 1.2;
        return 1.0;
    }

    public isFlaming(streak: number): boolean {
        return streak >= 3;
    }
}
