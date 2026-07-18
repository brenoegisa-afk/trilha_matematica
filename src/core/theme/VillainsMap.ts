/**
 * VillainsMap — desafios da Batalha vestidos no tema bíblico (ver HeroesMap.ts).
 *
 * Antes: goblins, dragões e um "Alienígena X" — fantasia genérica sem relação
 * com o tema dos heróis. Agora: os próprios desafios que os heróis bíblicos
 * enfrentaram, mantendo o tom "coragem diante do gigante" (não violência) já
 * usado em HeroesMap — vencer é RESPONDER CERTO, não atacar.
 *
 * HP/dificuldade mantidos idênticos ao pool antigo (mesmo balanceamento),
 * só a pele muda.
 */

export interface Villain {
    id: string;
    name: string;
    icon: string;
    baseHp: number;
}

export const MATH_VILLAINS: Villain[] = [
    { id: 'walls_jericho', name: 'Muralhas de Jericó', icon: '🧱', baseHp: 100 },
    { id: 'pharaohs_army', name: 'Exército do Faraó', icon: '🐎', baseHp: 200 },
    { id: 'storm_galilee', name: 'Tempestade no Mar', icon: '🌊', baseHp: 150 },
    { id: 'giant_goliath', name: 'Golias, o Gigante', icon: '🗿', baseHp: 250 },
];
