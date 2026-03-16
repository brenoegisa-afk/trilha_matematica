import type { Player, Mascot } from '../types';

export class MascotEngine {
    private allMascots: Mascot[] = [
        { id: 'fire_dragon', name: 'Dragão de Fogo', icon: '🐲', buff: { type: 'xp_boost', value: 0.1 } },
        { id: 'ice_owl', name: 'Coruja de Gelo', icon: '🦉', buff: { type: 'protection', value: 1 } },
        { id: 'math_cat', name: 'Gato da Lógica', icon: '🐱', buff: { type: 'damage', value: 20 } },
        { id: 'smart_fox', name: 'Raposa Astuta', icon: '🦊', buff: { type: 'xp_boost', value: 0.05 } }
    ];

    constructor() {}

    public calculateXPBonus(player: Player, baseXP: number): number {
        if (!player.mascots) return 0;
        const bonus = player.mascots.reduce((acc, mascot) => {
            if (mascot.buff.type === 'xp_boost') return acc + mascot.buff.value;
            return acc;
        }, 0);
        return Math.floor(baseXP * bonus);
    }

    public getProtectionBonus(player: Player): number {
        if (!player.mascots) return 0;
        return player.mascots.reduce((acc, mascot) => {
            if (mascot.buff.type === 'protection') return acc + mascot.buff.value;
            return acc;
        }, 0);
    }

    public getDamageBonus(player: Player): number {
        if (!player.mascots) return 0;
        return player.mascots.reduce((acc, mascot) => {
            if (mascot.buff.type === 'damage') return acc + mascot.buff.value;
            return acc;
        }, 0);
    }

    public getRandomMascot(): Mascot {
        return this.allMascots[Math.floor(Math.random() * this.allMascots.length)];
    }

    public addMascotToPlayer(player: Player, mascot: Mascot): void {
        if (!player.mascots) player.mascots = [];
        const alreadyHas = player.mascots.some(m => m.id === mascot.id);
        if (!alreadyHas) {
            player.mascots.push(mascot);
        }
    }
}
