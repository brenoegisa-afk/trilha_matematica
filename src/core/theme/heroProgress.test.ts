import { describe, it, expect } from 'vitest';
import { getPlayerHeroStage } from './heroProgress';
import { CurriculumGraph } from '../learning/CurriculumGraph';
import type { Player, NodeMastery } from '../types';

function makePlayer(nodeMastery: Record<string, NodeMastery> = {}): Player {
    return {
        id: 'p1',
        name: 'Teste',
        color: 'red',
        avatar: '🙂',
        currentPosition: 0,
        inventoryProtectionCount: 0,
        score: 0,
        streak: 1,
        level: 1,
        xp: 0,
        achievements: [],
        hp: 100,
        maxHp: 100,
        mascots: [],
        skillsMastery: [],
        srsReviews: [],
        sessionStats: { totalQuestions: 0, correctAnswers: 0, skillsPracticed: {} },
        nodeMastery
    };
}

function mastered(nodeId: string): NodeMastery {
    const node = CurriculumGraph.getNode(nodeId)!;
    return { nodeId, points: node.masteryThreshold, attempts: 5, successes: 5, mastered: true };
}

describe('getPlayerHeroStage', () => {
    it('perfil novo (sem nada dominado) começa no estágio 1', () => {
        const player = makePlayer();
        expect(getPlayerHeroStage(player)).toBe(1);
    });

    it('REGRESSÃO: dominar um único nó de profundidade 5 não pula direto para o estágio 5', () => {
        // Este era o bug relatado: um aluno na série "5" podia dominar um único nó
        // de depth 5 (via fallback de série, sem passar pelos fundamentos) e o herói
        // saltava de Pastor (1) direto para Rei (5) numa única partida.
        const player = makePlayer({ add_decimals: mastered('add_decimals') });
        expect(getPlayerHeroStage(player)).toBeLessThan(5);
        expect(getPlayerHeroStage(player)).toBe(1); // 1 nó de 22 ainda é ratio baixo
    });

    it('estágio sobe conforme o VOLUME de nós dominados cresce', () => {
        const total = CurriculumGraph.getNodesBySubject('math').length;
        const mathNodeIds = CurriculumGraph.getNodesBySubject('math').map(n => n.id);

        const masterN = (n: number) => {
            const entries: Record<string, NodeMastery> = {};
            for (let i = 0; i < n; i++) entries[mathNodeIds[i]] = mastered(mathNodeIds[i]);
            return makePlayer(entries);
        };

        const stage0 = getPlayerHeroStage(masterN(0));
        const stageHalf = getPlayerHeroStage(masterN(Math.floor(total / 2)));
        const stageAll = getPlayerHeroStage(masterN(total));

        expect(stage0).toBe(1);
        expect(stageAll).toBe(5);
        expect(stageHalf).toBeGreaterThan(stage0);
        expect(stageHalf).toBeLessThan(stageAll);
    });

    it('nunca ultrapassa o estágio 5 nem fica abaixo de 1', () => {
        const mathNodeIds = CurriculumGraph.getNodesBySubject('math').map(n => n.id);
        const entries: Record<string, NodeMastery> = {};
        mathNodeIds.forEach(id => { entries[id] = mastered(id); });
        expect(getPlayerHeroStage(makePlayer(entries))).toBe(5);
        expect(getPlayerHeroStage(makePlayer())).toBeGreaterThanOrEqual(1);
    });

    it('ignora nós de outras matérias (português/ciências) no cálculo', () => {
        const player = makePlayer({
            // Um id qualquer de outra matéria não deveria contar como progresso de herói.
            letters_syllables: { nodeId: 'letters_syllables', points: 1000, attempts: 10, successes: 10, mastered: true }
        });
        expect(getPlayerHeroStage(player)).toBe(1);
    });
});
