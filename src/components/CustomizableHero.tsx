import { HeroAvatar } from './HeroAvatar';
import { getOption, type CharacterConfig } from '../core/theme/customization';

/**
 * CustomizableHero — o herói + os itens de customização (companheiro, aura)
 * compostos numa cena. O herói em si (roupa) vem do estágio de evolução;
 * os overlays são a customização livre da criança.
 */
interface CustomizableHeroProps {
    heroId: string;
    stage?: number;
    config?: CharacterConfig;
    size?: number;             // altura do herói em px
}

export function CustomizableHero({ heroId, stage = 5, config = {}, size = 200 }: CustomizableHeroProps) {
    const companion = getOption('companion', config.companion);
    const aura = getOption('aura', config.aura);

    return (
        <div style={{ position: 'relative', display: 'inline-block', lineHeight: 0 }}>
            {/* Aura — atrás/acima da cabeça */}
            {aura?.emoji && (
                <span
                    style={{
                        position: 'absolute',
                        top: -size * 0.06,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: size * 0.22,
                        zIndex: 0,
                        pointerEvents: 'none',
                        filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.25))',
                    }}
                >
                    {aura.emoji}
                </span>
            )}

            <div style={{ position: 'relative', zIndex: 1 }}>
                <HeroAvatar heroId={heroId} stage={stage} size={size} />
            </div>

            {/* Companheiro — cantinho inferior */}
            {companion?.emoji && (
                <span
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        right: -size * 0.02,
                        fontSize: size * 0.28,
                        zIndex: 2,
                        pointerEvents: 'none',
                        filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.3))',
                        animation: 'bounce var(--transition-bounce, 0.4s) infinite alternate',
                    }}
                >
                    {companion.emoji}
                </span>
            )}
        </div>
    );
}
