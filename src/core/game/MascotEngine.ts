import type { Player } from '../types';

export interface MascotStats {
    xpMultiplier: number;
    protectionChance: number;
    damageMultiplier: number;
    description: string;
}

export interface MascotArchetype {
    id: string;
    name: string;
    icon: string;
    stage: 'base' | 'evolved' | 'omega';
    stats: MascotStats;
    evolutionLevel?: number;
}

export class MascotEngine {
    private archetypes: MascotArchetype[] = [
        { 
            id: 'bot_alpha', name: 'Bot-01', icon: '🤖', stage: 'base', evolutionLevel: 5,
            stats: { xpMultiplier: 1.1, protectionChance: 0.05, damageMultiplier: 1.0, description: 'Protótipo explorador. Pequeno bônus de XP.' } 
        },
        { 
            id: 'bot_prime', name: 'Nexus Prime', icon: '🛰️', stage: 'evolved', evolutionLevel: 15,
            stats: { xpMultiplier: 1.25, protectionChance: 0.15, damageMultiplier: 1.2, description: 'Unidade avançada de processamento.' } 
        },
        { 
            id: 'owl_scribe', name: 'Coruja Escriba', icon: '🦉', stage: 'base', evolutionLevel: 5,
            stats: { xpMultiplier: 1.05, protectionChance: 0.2, damageMultiplier: 1.0, description: 'Foco em sabedoria e proteção passiva.' } 
        },
        { 
            id: 'owl_sage', name: 'Grande Sábia', icon: '📚', stage: 'evolved',
            stats: { xpMultiplier: 1.15, protectionChance: 0.4, damageMultiplier: 1.1, description: 'Domínio total das regras da trilha.' } 
        },
        { 
            id: 'atom_spark', name: 'Átomo Centelha', icon: '⚛️', stage: 'base', evolutionLevel: 8,
            stats: { xpMultiplier: 1.0, protectionChance: 0.0, damageMultiplier: 1.5, description: 'Alta energia. Bônus em batalhas.' } 
        }
    ];

    public calculateXPBonus(player: Player, baseXP: number): number {
        const mascot = player.mascots?.find(m => m.equipped);
        if (!mascot) return 0;
        
        const archetype = this.archetypes.find(a => a.id === mascot.id);
        if (!archetype) return 0;

        const multiplier = archetype.stats.xpMultiplier - 1;
        return Math.floor(baseXP * multiplier);
    }

    public shouldProtect(player: Player): boolean {
        const mascot = player.mascots?.find(m => m.equipped);
        if (!mascot) return false;

        const archetype = this.archetypes.find(a => a.id === mascot.id);
        if (!archetype) return false;

        return Math.random() < archetype.stats.protectionChance;
    }

    public getDamageMultiplier(player: Player): number {
        const mascot = player.mascots?.find(m => m.equipped);
        if (!mascot) return 1.0;

        const archetype = this.archetypes.find(a => a.id === mascot.id);
        return archetype?.stats.damageMultiplier || 1.0;
    }

    public checkEvolution(player: Player, mascotId: string): MascotArchetype | null {
        const archetype = this.archetypes.find(a => a.id === mascotId);
        if (!archetype || !archetype.evolutionLevel) return null;

        if (player.level >= archetype.evolutionLevel) {
            // Find next stage: same name base, different stage
            const currentPrefix = archetype.name.split(' ')[0];
            const next = this.archetypes.find(a => 
                a.name.includes(currentPrefix) && 
                a.stage === (archetype.stage === 'base' ? 'evolved' : 'omega')
            );
            return next || null;
        }
        return null;
    }

    public getAvailableBaseMascots(): MascotArchetype[] {
        return this.archetypes.filter(a => a.stage === 'base');
    }

    public addMascotToPlayer(player: Player, mascotId: any): void {
        if (!player.mascots) (player as any).mascots = [];
        const alreadyHas = player.mascots.some(m => m.id === mascotId.id);
        if (!alreadyHas) {
            player.mascots.push(mascotId);
        }
    }
}
