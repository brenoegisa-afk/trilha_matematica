import type { Player, SkillMastery } from '../types';

export class SkillEngine {
    constructor() {}

    /**
     * Updates player mastery for a specific skill based on answer correctness
     */
    public updateMastery(player: Player, skillId: string, isCorrect: boolean): SkillMastery {
        if (!player.skillsMastery) {
            player.skillsMastery = [];
        }

        let mastery = player.skillsMastery.find(m => m.skillId === skillId);

        if (!mastery) {
            mastery = {
                skillId,
                level: 'bronze',
                points: 0,
                attempts: 0,
                successes: 0
            };
            player.skillsMastery.push(mastery);
        }

        mastery.attempts += 1;
        if (isCorrect) {
            mastery.successes += 1;
            mastery.points = Math.min(1000, mastery.points + 50);
        } else {
            mastery.points = Math.max(0, mastery.points - 20);
        }

        // Update Level
        if (mastery.points >= 900) mastery.level = 'diamond';
        else if (mastery.points >= 600) mastery.level = 'gold';
        else if (mastery.points >= 300) mastery.level = 'silver';
        else mastery.level = 'bronze';

        return mastery;
    }

    /**
     * Recommends a difficulty for a skill based on points
     */
    public recommendDifficulty(masteryPoints: number): 'easy' | 'medium' | 'hard' {
        if (masteryPoints > 700) return 'hard';
        if (masteryPoints > 300) return 'medium';
        return 'easy';
    }

    /**
     * Gets overall mastery percentage for a set of skills
     */
    public getOverallMastery(player: Player, skillIds: string[]): number {
        if (!player.skillsMastery || skillIds.length === 0) return 0;
        
        const relevantMasteries = player.skillsMastery.filter(m => skillIds.includes(m.skillId));
        if (relevantMasteries.length === 0) return 0;

        const totalPoints = relevantMasteries.reduce((acc, m) => acc + m.points, 0);
        return Math.floor(totalPoints / (skillIds.length * 10)); // 0-100%
    }
}
