import { useState, useCallback } from 'react';
import type { Player, Enemy } from '../../core/types';
import { BattleEngine } from '../../core/game/BattleEngine';
import { MascotEngine } from '../../core/game/MascotEngine';

export function useBattleSystem(battleEngine: BattleEngine, mascotEngine: MascotEngine) {
    const [currentEnemy, setCurrentEnemy] = useState<Enemy | null>(null);

    const initBattle = useCallback((player: Player, subjectId: string) => {
        const enemy = battleEngine.generateEnemy(player.level, subjectId);
        setCurrentEnemy(enemy);
        return enemy;
    }, [battleEngine]);

    const resolveBattleTurn = useCallback((player: Player, isCorrect: boolean): { battleEnded: boolean, enemyDefeated: boolean } => {
        if (!currentEnemy) return { battleEnded: false, enemyDefeated: false };

        if (isCorrect) {
            const damageBonus = mascotEngine.getDamageBonus(player);
            const damage = battleEngine.calculateDamage(true, player.streak) + damageBonus;
            battleEngine.applyDamageToEnemy(damage);
            
            if (battleEngine.isEnemyDefeated()) {
                const reward = mascotEngine.getRandomMascot();
                mascotEngine.addMascotToPlayer(player, reward);
                battleEngine.endBattle();
                setCurrentEnemy(null);
                return { battleEnded: true, enemyDefeated: true };
            }
        }
        
        return { battleEnded: false, enemyDefeated: false };
    }, [currentEnemy, battleEngine, mascotEngine]);

    return {
        currentEnemy,
        setCurrentEnemy,
        initBattle,
        resolveBattleTurn
    };
}
