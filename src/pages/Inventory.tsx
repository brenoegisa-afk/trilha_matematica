import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import styles from './Inventory.module.css';
import { getSavedProfiles } from '../utils/saveSystem';
import type { SaveProfile } from '../utils/saveSystem';
import type { Mascot, Player } from '../core/types';
import { useNavigate } from 'react-router-dom';
import { MascotEngine } from '../core/game/MascotEngine';
import type { MascotArchetype } from '../core/game/MascotEngine';

const mascotEngine = new MascotEngine();

export default function Inventory() {
    const navigate = useNavigate();
    const { players: sessionPlayers, refreshPlayers } = useGameStore();
    const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(0);

    // Fallback logic: if no session players, use saved profiles
    const savedProfiles = getSavedProfiles();
    
    // Map SaveProfile to a partial Player structure for the UI
    const persistentPlayers: Player[] = savedProfiles.map(profile => ({
        id: profile.id,
        name: profile.name,
        color: 'var(--color-blue)',
        avatar: profile.equippedAvatar || '👤',
        mascot: profile.equippedMascot || '',
        streak: profile.streak || 0,
        class_id: profile.class_id || '',
        user_id: profile.user_id || '',
        currentPosition: 0,
        inventoryProtectionCount: 0,
        score: profile.totalScore,
        level: profile.stars > 100 ? Math.floor(profile.stars / 100) + 1 : 1,
        xp: profile.stars,
        achievements: [],
        hp: 100,
        maxHp: 100,
        mascots: (profile.unlockedMascots || []).map(mId => ({
            id: mId,
            name: mId.split('_')[0].charAt(0).toUpperCase() + mId.split('_')[0].slice(1),
            icon: '🐾', // Temporary icon, mascotEngine will handle real data
            equipped: mId === profile.equippedMascot,
            xp: 0,
            level: 1
        })),
        skillsMastery: [],
        sessionStats: { totalQuestions: 0, correctAnswers: 0, skillsPracticed: {} }
    }));

    const displayPlayers = sessionPlayers.length > 0 ? sessionPlayers : persistentPlayers;
    const player = displayPlayers[selectedPlayerIndex];

    const handleEquip = (mascotId: string) => {
        if (!player) return;
        player.mascots.forEach(m => m.equipped = m.id === mascotId);
        refreshPlayers(); // Force re-render and sync
    };

    if (!player) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    <div className={styles.chestIcon}>🧳</div>
                    <h2>Sua mochila está vazia!</h2>
                    <p>Você ainda não criou nenhum herói para começar a colecionar mascotes.</p>
                    <button 
                        className="btn-primary" 
                        onClick={() => navigate('/setup')}
                        style={{ marginTop: '20px', padding: '15px 30px' }}
                    >
                        Criar Meu Primeiro Herói!
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>🎒 Mochila de Aventuras</h1>
                <p>Equipe seus mascotes e veja sua evolução!</p>
            </header>

            <div className={styles.playerSelector}>
                {displayPlayers.map((p, idx) => (
                    <button 
                        key={p.id} 
                        className={idx === selectedPlayerIndex ? styles.activePlayer : ''}
                        onClick={() => setSelectedPlayerIndex(idx)}
                    >
                        <span className={styles.playerAvatar}>{p.avatar || '👤'}</span>
                        <span className={styles.playerName}>{p.name}</span>
                    </button>
                ))}
            </div>

            <div className={styles.mainContent}>
                <section className={styles.mascotGrid}>
                    <h2>Seus Mascotes</h2>
                    {player.mascots.length === 0 ? (
                        <div className={styles.noMascots}>
                            <p>Você ainda não tem mascotes. Ganhe batalhas para conquistá-los!</p>
                        </div>
                    ) : (
                        <div className={styles.grid}>
                            {player.mascots.map((m: Mascot) => {
                                const archetype = (mascotEngine as any).archetypes.find((a: MascotArchetype) => a.id === m.id);
                                return (
                                    <div 
                                        key={m.id} 
                                        className={`${styles.mascotCard} ${m.equipped ? styles.equipped : ''}`}
                                    >
                                        <div className={styles.mascotIcon}>{m.icon}</div>
                                        <h3>{m.name}</h3>
                                        <div className={styles.badge}>{archetype?.stage === 'base' ? 'Iniciante' : 'Evoluído'}</div>
                                        
                                        {archetype?.evolutionLevel && (
                                            <div className={styles.evolutionProgress}>
                                                <label>Evolução: Nível {archetype.evolutionLevel}</label>
                                                <div className={styles.miniBar}>
                                                    <div 
                                                        className={styles.miniBarFill} 
                                                        style={{ width: `${Math.min(100, (player.level / archetype.evolutionLevel) * 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}

                                        {!m.equipped ? (
                                            <button onClick={() => handleEquip(m.id)} className={styles.equipBtn}>Equipar</button>
                                        ) : (
                                            <span className={styles.equippedLabel}>Em uso</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                <aside className={styles.statsPanel}>
                    <h2>Estatísticas Ativas</h2>
                    {player.mascots.some(m => m.equipped) ? (
                        <div className={styles.activeStats}>
                            {player.mascots.filter(m => m.equipped).map(m => {
                                const archetype = (mascotEngine as any).archetypes.find((a: MascotArchetype) => a.id === m.id);
                                if (!archetype) return null;
                                return (
                                    <div key={m.id} className={styles.statList}>
                                        <div className={styles.statItem}>
                                            <label>Bônus de XP</label>
                                            <div className={styles.barContainer}>
                                                <div className={styles.barFill} style={{ width: `${(archetype.stats.xpMultiplier - 1) * 300}%` }}></div>
                                                <span>+{(archetype.stats.xpMultiplier - 1) * 100}%</span>
                                            </div>
                                        </div>
                                        <div className={styles.statItem}>
                                            <label>Proteção</label>
                                            <div className={styles.barContainer}>
                                                <div className={styles.barFill} style={{ width: `${archetype.stats.protectionChance * 100}%` }}></div>
                                                <span>{archetype.stats.protectionChance * 100}%</span>
                                            </div>
                                        </div>
                                        <div className={styles.statItem}>
                                            <label>Multiplicador de Dano</label>
                                            <div className={styles.barContainer}>
                                                <div className={styles.barFill} style={{ width: `${(archetype.stats.damageMultiplier - 1) * 100}%` }}></div>
                                                <span>x{archetype.stats.damageMultiplier}</span>
                                            </div>
                                        </div>
                                        <p className={styles.description}>"{archetype.stats.description}"</p>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className={styles.noActiveStats}>Equipe um mascote para ganhar bônus!</p>
                    )}
                </aside>
            </div>
        </div>
    );
}
