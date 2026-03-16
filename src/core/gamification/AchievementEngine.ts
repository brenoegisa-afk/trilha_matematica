import type { Player, Achievement } from '../types';

export class AchievementEngine {
    private achievementList: Achievement[] = [
        { id: 'first_win', name: 'Primeira Vitória', description: 'Chegou ao final da trilha pela primeira vez!', icon: '🏆' },
        { id: 'streak_3', name: 'Tripliquei!', description: 'Acertou 3 questões seguidas!', icon: '🔥' },
        { id: 'streak_7', name: 'Invencível', description: 'Acertou 7 questões seguidas!', icon: '⚡' },
        { id: 'xp_1000', name: 'Veterano', description: 'Alcançou 1.000 XP totais', icon: '⭐' },
        { id: 'math_master', name: 'Mestre da Matemática', description: 'Acertou 50 questões no total', icon: '🧠' }
    ];

    constructor() {}

    public checkNewAchievements(player: Player): Achievement[] {
        const newlyUnlocked: Achievement[] = [];

        // Check streak achievements
        if (player.streak >= 3 && !this.hasAchievement(player, 'streak_3')) {
            newlyUnlocked.push(this.getAchievement('streak_3')!);
        }
        if (player.streak >= 7 && !this.hasAchievement(player, 'streak_7')) {
            newlyUnlocked.push(this.getAchievement('streak_7')!);
        }

        // Check XP achievements
        if (player.xp >= 1000 && !this.hasAchievement(player, 'xp_1000')) {
            newlyUnlocked.push(this.getAchievement('xp_1000')!);
        }

        // Check finish line
        if (player.currentPosition >= 35 && !this.hasAchievement(player, 'first_win')) {
            newlyUnlocked.push(this.getAchievement('first_win')!);
        }

        return newlyUnlocked;
    }

    private hasAchievement(player: Player, id: string): boolean {
        return player.achievements.some(a => a.id === id);
    }

    private getAchievement(id: string): Achievement | undefined {
        return this.achievementList.find(a => a.id === id);
    }
}
