import type { Player, Achievement } from '../types';

export class AchievementEngine {
    private achievementList: Achievement[] = [
        { id: 'first_win', name: 'Primeira Vitória', description: 'Chegou ao final da trilha pela primeira vez!', icon: '🏆' },
        { id: 'streak_3', name: 'Tripliquei!', description: 'Acertou 3 questões seguidas!', icon: '🔥' },
        { id: 'streak_7', name: 'Invencível', description: 'Acertou 7 questões seguidas!', icon: '⚡' },
        { id: 'xp_1000', name: 'Veterano', description: 'Alcançou 1.000 XP totais', icon: '⭐' },
        { id: 'math_master', name: 'Mestre da Matemática', description: 'Acertou 50 questões no total', icon: '🧠' },
        { id: 'mascot_evolve', name: 'Mestre Evolutivo', description: 'Seu mascote alcançou uma nova forma!', icon: '🧬' },
        { id: 'all_subjects', name: 'Polímata', description: 'Demonstrou conhecimento em todas as áreas!', icon: '🌍' }
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

        // Check Evolution
        const hasEvolved = player.mascots.some(m => m.id.includes('prime') || m.id.includes('sage'));
        if (hasEvolved && !this.hasAchievement(player, 'mascot_evolve')) {
            newlyUnlocked.push(this.getAchievement('mascot_evolve')!);
        }

        // Check Subject Mastery (Simplified check)
        const expertMath = player.skillsMastery.some(s => s.skillId.includes('math') && s.level === 'silver');
        const expertPort = player.skillsMastery.some(s => s.skillId.includes('port') && s.level === 'silver');
        if (expertMath && expertPort && !this.hasAchievement(player, 'all_subjects')) {
            newlyUnlocked.push(this.getAchievement('all_subjects')!);
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
