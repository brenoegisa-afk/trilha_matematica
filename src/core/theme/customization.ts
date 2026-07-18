/**
 * customization.ts — Camada de CUSTOMIZAÇÃO do herói (ideia: "vista/monte seu herói").
 *
 * Decisão de produto: a ROUPA do herói é a evolução (muda sozinha conforme a
 * criança domina a matéria — ver HeroesMap.stages). Portanto a customização
 * LIVRE mora em slots que NÃO conflitam com a evolução: um companheiro (bichinho)
 * e uma aura. Seguro para app infantil (sem upload, sem IA aberta).
 *
 * Os "acessórios" são emojis por ora (placeholder). Depois trocamos por PNGs em
 * `public/parts/<slot>/<id>.png` sem mudar o modelo de dados.
 */

export interface CustomizationOption {
    id: string;
    label: string;
    emoji: string;   // vazio = "nenhum"
}

export interface CustomizationSlot {
    id: string;      // vira chave em CharacterConfig
    label: string;
    options: CustomizationOption[];
}

/** Escolha da criança: { slotId: optionId }. */
export type CharacterConfig = Record<string, string>;

export const CUSTOMIZATION_SLOTS: CustomizationSlot[] = [
    {
        id: 'companion',
        label: 'Companheiro',
        options: [
            { id: 'none', label: 'Nenhum', emoji: '' },
            { id: 'lamb', label: 'Cordeiro', emoji: '🐑' },
            { id: 'dove', label: 'Pomba', emoji: '🕊️' },
            { id: 'lion', label: 'Leãozinho', emoji: '🦁' },
            { id: 'camel', label: 'Camelo', emoji: '🐫' },
            { id: 'goat', label: 'Cabritinho', emoji: '🐐' },
        ],
    },
    {
        id: 'aura',
        label: 'Aura',
        options: [
            { id: 'none', label: 'Nenhuma', emoji: '' },
            { id: 'sparkles', label: 'Brilhos', emoji: '✨' },
            { id: 'star', label: 'Estrela', emoji: '⭐' },
            { id: 'courage', label: 'Coragem', emoji: '🔥' },
            { id: 'rainbow', label: 'Arco-íris', emoji: '🌈' },
        ],
    },
];

/** Opção default (a primeira) de cada slot — usada quando nada foi escolhido. */
export function defaultConfig(): CharacterConfig {
    const cfg: CharacterConfig = {};
    for (const slot of CUSTOMIZATION_SLOTS) cfg[slot.id] = slot.options[0].id;
    return cfg;
}

/** Busca a opção escolhida (ou a primeira) de um slot. */
export function getOption(slotId: string, optionId?: string): CustomizationOption | undefined {
    const slot = CUSTOMIZATION_SLOTS.find(s => s.id === slotId);
    if (!slot) return undefined;
    return slot.options.find(o => o.id === optionId) || slot.options[0];
}

/** Chave estável "slotId:optionId" usada para marcar um item como desbloqueado. */
export function cosmeticKey(slotId: string, optionId: string): string {
    return `${slotId}:${optionId}`;
}

/**
 * Sorteia um item de customização AINDA NÃO desbloqueado (recompensa concreta
 * de jogar — ver ROADMAP §11.3). A primeira opção de cada slot ("Nenhum") não
 * conta: já vem disponível, não é prêmio.
 */
export function pickRandomLockedOption(
    unlocked: string[]
): { slot: CustomizationSlot; option: CustomizationOption } | null {
    const unlockedSet = new Set(unlocked);
    const locked: { slot: CustomizationSlot; option: CustomizationOption }[] = [];

    for (const slot of CUSTOMIZATION_SLOTS) {
        for (const option of slot.options.slice(1)) { // pula "Nenhum"
            if (!unlockedSet.has(cosmeticKey(slot.id, option.id))) {
                locked.push({ slot, option });
            }
        }
    }

    if (locked.length === 0) return null;
    return locked[Math.floor(Math.random() * locked.length)];
}
