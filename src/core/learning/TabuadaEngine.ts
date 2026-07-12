/**
 * TabuadaEngine — Fluência na tabuada (2 a 10).
 *
 * Foco pedagógico: FLUÊNCIA (recordar rápido), não compreensão. Por isso o
 * domínio de um fato exige acertos repetidos e recompensa velocidade. O treino
 * é adaptativo: os fatos que a criança erra ou não domina aparecem mais.
 */

import type { TabuadaFact } from '../types';

export const TAB_MIN = 2;
export const TAB_MAX = 10;
export const MASTER_SCORE = 4;       // pontos para "dominar" um fato
export const FAST_MS = 4000;         // abaixo disso, acerto conta como "de cor" (vale mais)

export type TabuadaMap = Record<string, TabuadaFact>;

export function factKey(a: number, b: number): string {
    return `${a}x${b}`;
}

export function allFacts(): { a: number; b: number }[] {
    const facts: { a: number; b: number }[] = [];
    for (let a = TAB_MIN; a <= TAB_MAX; a++) {
        for (let b = TAB_MIN; b <= TAB_MAX; b++) {
            facts.push({ a, b });
        }
    }
    return facts;
}

export function totalFacts(): number {
    const n = TAB_MAX - TAB_MIN + 1;
    return n * n;
}

export function getFact(mastery: TabuadaMap, a: number, b: number): TabuadaFact | undefined {
    return mastery[factKey(a, b)];
}

export function isMastered(mastery: TabuadaMap, a: number, b: number): boolean {
    return !!mastery[factKey(a, b)]?.mastered;
}

export function masteredCount(mastery: TabuadaMap): number {
    return Object.values(mastery).filter(f => f.mastered).length;
}

function weightedPick(
    pool: { a: number; b: number }[],
    weightOf: (f: { a: number; b: number }) => number
): { a: number; b: number } {
    const total = pool.reduce((s, f) => s + weightOf(f), 0);
    let r = Math.random() * total;
    for (const f of pool) {
        r -= weightOf(f);
        if (r <= 0) return f;
    }
    return pool[pool.length - 1];
}

/**
 * Escolhe o próximo fato a treinar (adaptativo) com foco em ENCHER A GRADE:
 * - prioriza TERMINAR os fatos já começados (senão nada chega ao domínio);
 * - só introduz um fato novo de vez em quando (mantém um "working set" pequeno);
 * - fatos dominados só voltam quando não há mais nada a fazer (revisão);
 * - evita repetir o fato imediatamente anterior.
 */
export function pickFact(mastery: TabuadaMap, avoidKey?: string): { a: number; b: number } {
    const facts = allFacts().filter(f => factKey(f.a, f.b) !== avoidKey);

    const inProgress = facts.filter(f => {
        const m = mastery[factKey(f.a, f.b)];
        return m && !m.mastered && m.score > 0;
    });
    const fresh = facts.filter(f => !mastery[factKey(f.a, f.b)]);

    // 70% das vezes, volta a um fato em progresso para levá-lo ao domínio
    // (preferindo os mais perto de dominar). Assim a grade realmente enche.
    if (inProgress.length > 0 && (fresh.length === 0 || Math.random() < 0.7)) {
        return weightedPick(inProgress, f => (mastery[factKey(f.a, f.b)]?.score || 0) + 1);
    }
    if (fresh.length > 0) {
        return fresh[Math.floor(Math.random() * fresh.length)];
    }
    // Tudo dominado (ou só sobra dominado) → revisão aleatória.
    const pool = facts.length ? facts : allFacts();
    return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Registra uma resposta e devolve o mapa atualizado + se o fato acabou de ser dominado.
 * Sem punição pesada: errar só reduz um pouco o progresso daquele fato.
 */
export function registerAnswer(
    mastery: TabuadaMap,
    a: number,
    b: number,
    isCorrect: boolean,
    fast: boolean
): { mastery: TabuadaMap; justMastered: boolean } {
    const key = factKey(a, b);
    const next: TabuadaMap = { ...mastery };
    const f: TabuadaFact = next[key]
        ? { ...next[key] }
        : { a, b, score: 0, attempts: 0, correct: 0, mastered: false };

    f.attempts += 1;
    let justMastered = false;

    if (isCorrect) {
        f.correct += 1;
        f.score += fast ? 2 : 1;
        if (!f.mastered && f.score >= MASTER_SCORE) {
            f.mastered = true;
            justMastered = true;
        }
    } else {
        f.score = Math.max(0, f.score - 1);
    }

    next[key] = f;
    return { mastery: next, justMastered };
}
