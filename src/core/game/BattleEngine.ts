import type { Enemy } from '../types';

export class BattleEngine {
    private currentEnemy: Enemy | null = null;

    constructor() {}

    public generateEnemy(playerLevel: number, subjectId: string = 'math'): Enemy {
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
        
        this.currentEnemy = {
            id: baseEnemy.id,
            name: baseEnemy.name,
            icon: baseEnemy.icon,
            maxHp: Math.floor(baseEnemy.baseHp * levelMultiplier),
            hp: Math.floor(baseEnemy.baseHp * levelMultiplier),
            level: playerLevel
        };

        return this.currentEnemy;
    }

    public calculateDamage(isCorrect: boolean, streak: number): number {
        if (!isCorrect) return 0;
        const baseDamage = 50;
        const streakBonus = Math.floor(streak * 10);
        return baseDamage + streakBonus;
    }

    public isEnemyDefeated(): boolean {
        return this.currentEnemy !== null && this.currentEnemy.hp <= 0;
    }

    public applyDamageToEnemy(damage: number): void {
        if (this.currentEnemy) {
            this.currentEnemy.hp = Math.max(0, this.currentEnemy.hp - damage);
        }
    }

    // New: Player Damage Logic
    public applyDamageToPlayer(player: any): number {
        const damage = 25; // Base damage the player takes for answering wrong
        player.hp = Math.max(0, player.hp - damage);
        return damage;
    }

    public isPlayerDefeated(player: any): boolean {
        return player.hp <= 0;
    }

    public getCurrentEnemy(): Enemy | null {
        return this.currentEnemy;
    }

    public resetPlayerHp(player: any): void {
        player.hp = player.maxHp || 100;
    }

    public endBattle(): void {
        this.currentEnemy = null;
    }
}
