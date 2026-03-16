import type { TileType } from '../types';

export class XPEngine {
    private baseXP = {
        'Green': 50,
        'Red': 100,
        'Yellow': 30,
        'Blue': 20,
        'Normal': 10,
        'Start': 0,
        'Finish': 200
    };

    constructor() {}

    public calculateXP(tileType: TileType, isCorrect: boolean, streak: number): number {
        if (!isCorrect) return 0;

        const base = this.baseXP[tileType] || 0;
        const multiplier = streak >= 3 ? 1.2 : 1.0;

        return Math.floor(base * multiplier);
    }

    public calculateLevel(totalXP: number): number {
        // Simple linear progression: 500 XP per level
        return Math.floor(totalXP / 500) + 1;
    }

    public getXPForNextLevel(currentLevel: number): number {
        return currentLevel * 500;
    }
}
