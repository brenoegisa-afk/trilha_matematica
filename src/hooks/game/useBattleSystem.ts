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

    const resolveBattleTurn = useCallback((player: Player, isCorrect: boolean): { battleEnded: boolean, enemyDefeated: boolean, playerDefeated: boolean } => {
        if (!currentEnemy) return { battleEnded: false, enemyDefeated: false, playerDefeated: false };

        if (isCorrect) {
            const damageBonus = mascotEngine.getDamageBonus(player);
            const damage = battleEngine.calculateDamage(true, player.streak) + damageBonus;
            battleEngine.applyDamageToEnemy(damage);
            
            if (battleEngine.isEnemyDefeated()) {
                const reward = mascotEngine.getRandomMascot();
                mascotEngine.addMascotToPlayer(player, reward);
                
                // Heal player on victory
                battleEngine.resetPlayerHp(player);
                
                battleEngine.endBattle();
                setCurrentEnemy(null);
                return { battleEnded: true, enemyDefeated: true, playerDefeated: false };
            }
        } else {
            // Player takes damage on wrong answer
            battleEngine.applyDamageToPlayer(player);
            
            if (battleEngine.isPlayerDefeated(player)) {
                // Heal player upon fleeing/defeat
                battleEngine.resetPlayerHp(player);
                
                battleEngine.endBattle();
                setCurrentEnemy(null);
                return { battleEnded: true, enemyDefeated: false, playerDefeated: true };
            }
        }
        
        return { battleEnded: false, enemyDefeated: false, playerDefeated: false };
    }, [currentEnemy, battleEngine, mascotEngine]);

    return {
        currentEnemy,
        setCurrentEnemy,
        initBattle,
        resolveBattleTurn
    };
}
