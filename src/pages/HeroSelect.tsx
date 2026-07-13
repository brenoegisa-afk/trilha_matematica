import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { HeroesMap, type Hero, type HeroMechanic } from '../core/theme/HeroesMap';
import { HeroAvatar } from '../components/HeroAvatar';
import { playSfx } from '../utils/sfx';
import { triggerConfetti } from '../utils/confetti';
import styles from './HeroSelect.module.css';

// Rótulo curto e amigável para a mecânica de cada herói (o "como" vira promessa).
const MECHANIC_LABEL: Record<HeroMechanic, string> = {
    boss: 'Enfrenta gigantes',
    decision: 'Decisões certeiras',
    streak: 'Cresce todo dia',
    logic: 'Padrões & lógica',
    progress: 'Conquista terras',
    fluency: 'Treino diário',
};

type GenderFilter = 'all' | 'm' | 'f';

export default function HeroSelect() {
    const navigate = useNavigate();
    const { selectedHeroId, selectHero } = useGame();

    const [filter, setFilter] = useState<GenderFilter>('all');
    // Herói em foco no painel de detalhe (começa no já-escolhido, se houver).
    const [focusedId, setFocusedId] = useState<string | null>(selectedHeroId);

    const heroes = HeroesMap.getAllHeroes().filter(
        h => filter === 'all' || h.gender === filter
    );
    const focused: Hero | undefined = focusedId ? HeroesMap.getHero(focusedId) : undefined;

    const handleConfirm = () => {
        if (!focused) return;
        selectHero(focused.id);
        playSfx('levelup');
        triggerConfetti();
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Escolha seu Herói</h1>
            <p className={styles.subtitle}>
                Você não vai só jogar — você vai <strong>ser</strong> um herói corajoso.
                Cada acerto fortalece a sua armadura!
            </p>

            {/* Filtro de gênero */}
            <div className={styles.filterBar}>
                {([
                    { id: 'all', label: '✨ Todos' },
                    { id: 'm', label: '🛡️ Guerreiros' },
                    { id: 'f', label: '👑 Guerreiras' },
                ] as const).map(f => (
                    <button
                        key={f.id}
                        className={`${styles.filterBtn} ${filter === f.id ? styles.filterActive : ''}`}
                        onClick={() => setFilter(f.id)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Grade de heróis */}
            <div className={styles.grid}>
                {heroes.map(hero => (
                    <div
                        key={hero.id}
                        className={`${styles.card} ${focusedId === hero.id ? styles.cardSelected : ''}`}
                        onClick={() => { setFocusedId(hero.id); playSfx('step'); }}
                    >
                        {selectedHeroId === hero.id && (
                            <span className={styles.equippedTag}>MEU HERÓI</span>
                        )}
                        <span className={styles.cardIcon}>
                            <HeroAvatar heroId={hero.id} stage={5} size={72} />
                        </span>
                        <span className={styles.cardName}>{hero.name}</span>
                        <span className={styles.cardTagline}>{hero.tagline}</span>
                        <span className={styles.mechanicBadge}>{MECHANIC_LABEL[hero.mechanic]}</span>
                    </div>
                ))}
            </div>

            {/* Painel de detalhe do herói em foco */}
            {focused ? (
                <div className={styles.detail}>
                    <div className={styles.detailHeader}>
                        <span className={styles.detailIcon}>
                            <HeroAvatar heroId={focused.id} stage={5} size={96} />
                        </span>
                        <div>
                            <div className={styles.detailName}>{focused.name}</div>
                            <div className={styles.detailVirtue}>{focused.virtue}</div>
                        </div>
                    </div>
                    <p className={styles.detailTagline}>“{focused.tagline}”</p>

                    <div className={styles.stagesTitle}>
                        ⚔️ Como seu herói cresce
                    </div>
                    <ul className={styles.stageList}>
                        {focused.stages.map(stage => (
                            <li key={stage.depth} className={styles.stageItem}>
                                <span className={styles.stageDepth}>{stage.depth}</span>
                                <HeroAvatar heroId={focused.id} stage={stage.depth} size={52} fallback="none" />
                                <div className={styles.stageBody}>
                                    <div className={styles.stageName}>{stage.title}</div>
                                    <div className={styles.stageVisual}>{stage.visual}</div>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div className={styles.actions}>
                        <button className={styles.backBtn} onClick={() => navigate('/')}>
                            🔙 Voltar
                        </button>
                        {selectedHeroId === focused.id ? (
                            <button
                                className={styles.confirmBtn}
                                onClick={() => navigate('/customizar')}
                            >
                                🎨 Personalizar
                            </button>
                        ) : (
                            <button className={styles.confirmBtn} onClick={handleConfirm}>
                                Sou eu, {focused.name}!
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <p className={styles.hint}>👆 Toque em um herói para conhecê-lo!</p>
            )}
        </div>
    );
}
