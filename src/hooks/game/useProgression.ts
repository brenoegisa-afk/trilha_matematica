import { useState, useCallback } from 'react';
import type { Player, TileType } from '../../core/types';
import { XPEngine } from '../../core/gamification/XPEngine';
import { MascotEngine } from '../../core/game/MascotEngine';

export function useProgression(xpEngine: XPEngine, mascotEngine: MascotEngine) {
    const [levelUpData, setLevelUpData] = useState<{ playerName: string, oldLevel: number, newLevel: number } | null>(null);
    const [xpNotification, setXpNotification] = useState<{ amount: number } | null>(null);

    const applyXP = useCallback((player: Player, activeTileType: TileType, isCorrect: boolean, streak: number) => {
        if (!isCorrect) return;

        const oldLevel = player.level;
        const baseXP = xpEngine.calculateXP(activeTileType, true, streak);
        const mascotBonus = mascotEngine.calculateXPBonus(player, baseXP);
        const xpGained = baseXP + mascotBonus;
        
        player.score += xpGained;
        player.xp += xpGained;
        const newLevel = xpEngine.calculateLevel(player.xp);
        player.level = newLevel;

        setXpNotification({ amount: xpGained });

        if (newLevel > oldLevel) {
            setLevelUpData({
                playerName: player.name,
                oldLevel: oldLevel,
                newLevel: newLevel
            });
        }
    }, [xpEngine, mascotEngine]);

    const clearLevelUp = useCallback(() => setLevelUpData(null), []);
    const clearXpNotification = useCallback(() => setXpNotification(null), []);

    return {
        levelUpData,
        xpNotification,
        applyXP,
        clearLevelUp,
        clearXpNotification
    };
}
