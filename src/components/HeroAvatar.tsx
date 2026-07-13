import { useState } from 'react';
import { HeroesMap } from '../core/theme/HeroesMap';

/**
 * HeroAvatar — renderiza o herói bíblico escolhido.
 *
 * Usa a arte em `public/heroes/<id>-<estágio>.png` se ela existir; se não
 * existir (herói ainda sem arte), cai graciosamente no emoji-símbolo do herói.
 * Assim dá pra ir soltando as imagens herói por herói, sem quebrar nada.
 */
interface HeroAvatarProps {
    heroId: string;
    stage?: number;                  // 1..5 (default 5 = forma icônica/final)
    size?: number;                   // altura em px (largura é automática)
    fallback?: 'emoji' | 'none';     // o que mostrar quando não há arte
    className?: string;
}

export function HeroAvatar({
    heroId,
    stage = 5,
    size = 64,
    fallback = 'emoji',
    className,
}: HeroAvatarProps) {
    const [failed, setFailed] = useState(false);
    const hero = HeroesMap.getHero(heroId);

    // Estágio seguro dentro de 1..5
    const safeStage = Math.max(1, Math.min(stage, 5));
    const src = `/heroes/${heroId}-${safeStage}.png`;

    if (!failed) {
        return (
            <img
                src={src}
                alt={hero?.name || heroId}
                className={className}
                onError={() => setFailed(true)}
                style={{
                    height: size,
                    width: 'auto',
                    maxWidth: '100%',
                    objectFit: 'contain',
                    display: 'block',
                }}
            />
        );
    }

    if (fallback === 'none') return null;

    return (
        <span
            className={className}
            style={{ fontSize: size * 0.82, lineHeight: 1, display: 'inline-block' }}
        >
            {hero?.icon || '⭐'}
        </span>
    );
}
