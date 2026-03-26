import type { Enemy, Player } from '../types';

/**
 * BattleEngine — Pure functions for battle logic.
 * Enemy state lives in Zustand, not here.
 */
export const BattleEngine = {
    generateEnemy(playerLevel: number, subjectId: string = 'math'): Enemy {
        const mathEnemies = [
            { id: 'math_goblin', name: 'Goblin da Soma', icon: '👺', baseHp: 100 },
            { id: 'division_dragon', name: 'Dragão da Divisão', icon: '🐲', baseHp: 250 },
            { id: 'geometry_ghost', name: 'Fantasma dos Ângulos', icon: '👻', baseHp: 150 },
            { id: 'algebra_alien', name: 'Alienígena X', icon: '👽', baseHp: 200 }
        ];

        const portEnemies = [
            { id: 'grammar_giant', name: 'Gigante da Gramática', icon: '👹', baseHp: 120 },
            { id: 'rhyme_rat', name: 'Rato das Rimas', icon: '🐭', baseHp: 80 },
            { id: 'typo_troll', name: 'Troll do Erro', icon: '👾', baseHp: 150 },
            { id: 'ink_squid', name: 'Lula de Nanquim', icon: '🦑', baseHp: 200 }
        ];

        const sciEnemies = [
            { id: 'virus_vortex', name: 'Vórtice Viral', icon: '🦠', baseHp: 110 },
            { id: 'tectonic_titan', name: 'Titã Tectônico', icon: '🌋', baseHp: 220 },
            { id: 'stellar_spider', name: 'Aranha Estelar', icon: '🕷️', baseHp: 130 },
            { id: 'fossil_fiend', name: 'Fera Fóssil', icon: '🦖', baseHp: 180 }
        ];

        let pool = mathEnemies;
        if (subjectId === 'portuguese') pool = portEnemies;
        if (subjectId === 'science') pool = sciEnemies;

        const baseEnemy = pool[Math.floor(Math.random() * pool.length)];
        const levelMultiplier = 1 + (playerLevel - 1) * 0.2;

        return {
            id: baseEnemy.id,
            name: baseEnemy.name,
            icon: baseEnemy.icon,
            maxHp: Math.floor(baseEnemy.baseHp * levelMultiplier),
            hp: Math.floor(baseEnemy.baseHp * levelMultiplier),
            level: playerLevel
        };
    },

    calculateDamage(isCorrect: boolean, streak: number): number {
        if (!isCorrect) return 0;
        const baseDamage = 50;
        const streakBonus = Math.floor(streak * 10);
        return baseDamage + streakBonus;
    },

    applyDamageToEnemy(enemy: Enemy, damage: number): Enemy {
        return { ...enemy, hp: Math.max(0, enemy.hp - damage) };
    },

    isEnemyDefeated(enemy: Enemy | null): boolean {
        return enemy !== null && enemy.hp <= 0;
    },

    applyDamageToPlayer(player: Player): Player {
        const damage = 25;
        return { ...player, hp: Math.max(0, player.hp - damage) };
    },

    isPlayerDefeated(player: Player): boolean {
        return player.hp <= 0;
    },

    resetPlayerHp(player: Player): Player {
        return { ...player, hp: player.maxHp || 100 };
    }
};
