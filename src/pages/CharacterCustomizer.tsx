import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { HeroesMap } from '../core/theme/HeroesMap';
import { CUSTOMIZATION_SLOTS, defaultConfig } from '../core/theme/customization';
import { CustomizableHero } from '../components/CustomizableHero';
import { playSfx } from '../utils/sfx';
import styles from './CharacterCustomizer.module.css';

export default function CharacterCustomizer() {
    const navigate = useNavigate();
    const { selectedHeroId, selectedHeroConfig, setHeroConfig } = useGame();

    // Sem herói escolhido ainda → manda escolher primeiro.
    if (!selectedHeroId) {
        return (
            <div className={styles.container}>
                <h1 className={styles.title}>Personalizar</h1>
                <div className={styles.empty}>
                    <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                        Primeiro escolha o seu herói! Depois você pode dar um
                        companheiro e uma aura pra ele. 🐑✨
                    </p>
                    <button className={styles.emptyBtn} onClick={() => navigate('/heroes')}>
                        ⚔️ Escolher meu herói
                    </button>
                </div>
            </div>
        );
    }

    const hero = HeroesMap.getHero(selectedHeroId);
    const config = { ...defaultConfig(), ...selectedHeroConfig };

    const pick = (slotId: string, optionId: string) => {
        setHeroConfig({ ...config, [slotId]: optionId });
        playSfx('step');
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Personalize a {hero?.name}</h1>
            <p className={styles.subtitle}>
                A roupa cresce sozinha conforme você aprende. Aqui você escolhe o
                que é <strong>só seu</strong>: um companheiro e uma aura!
            </p>

            {/* Preview ao vivo (mostra o estágio final pra ficar bonito) */}
            <div className={styles.stage}>
                <CustomizableHero heroId={selectedHeroId} stage={5} config={config} size={200} />
                <span className={styles.heroName}>{hero?.name}</span>
            </div>

            {/* Slots */}
            <div className={styles.slots}>
                {CUSTOMIZATION_SLOTS.map(slot => (
                    <div key={slot.id} className={styles.slot}>
                        <div className={styles.slotLabel}>{slot.label}</div>
                        <div className={styles.options}>
                            {slot.options.map(opt => (
                                <button
                                    key={opt.id}
                                    className={`${styles.option} ${config[slot.id] === opt.id ? styles.optionActive : ''}`}
                                    onClick={() => pick(slot.id, opt.id)}
                                >
                                    <span className={styles.optionEmoji}>{opt.emoji || '🚫'}</span>
                                    <span className={styles.optionLabel}>{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.actions}>
                <button className={styles.backBtn} onClick={() => navigate('/heroes')}>
                    🔙 Voltar
                </button>
                <button className={styles.doneBtn} onClick={() => navigate('/')}>
                    ✅ Pronto!
                </button>
            </div>
        </div>
    );
}
