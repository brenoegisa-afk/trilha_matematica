import { describe, expect, it } from 'vitest';
import { DiagnosticEngine, DIAGNOSTIC_MAX_CHALLENGES, DIAGNOSTIC_MIN_CHALLENGES } from './DiagnosticEngine';

describe('DiagnosticEngine', () => {
    it('começa um nível abaixo da série selecionada por eixo', () => {
        const nodes = DiagnosticEngine.getStartingNodes('math', '5');
        expect(nodes.length).toBeGreaterThan(0);
        expect(nodes.every(node => node.depth <= 4)).toBe(true);
        expect(new Set(nodes.map(node => node.skillId)).size).toBe(nodes.length);
    });

    it('sobe no mesmo eixo após acerto independente', () => {
        const starting = DiagnosticEngine.getStartingNodes('math', '3')[0];
        const next = DiagnosticEngine.getNextNode('math', '3', [{
            nodeId: starting.id, skillId: starting.skillId, isCorrect: true, supportLevel: 'none'
        }]);
        expect(next?.skillId).not.toBeUndefined();
    });

    it('distribui a segunda evidência entre os eixos antes de encerrar', () => {
        const starts = DiagnosticEngine.getStartingNodes('math', '5');
        const firstRound = starts.map(node => ({
            nodeId: node.id, skillId: node.skillId, isCorrect: true as const, supportLevel: 'none' as const
        }));

        const next = DiagnosticEngine.getNextNode('math', '5', firstRound);
        expect(next?.skillId).toBe(starts[0].skillId);

        const balanced = starts.flatMap(node => [
            { nodeId: node.id, skillId: node.skillId, isCorrect: true as const, supportLevel: 'none' as const },
            { nodeId: node.id, skillId: node.skillId, isCorrect: true as const, supportLevel: 'none' as const }
        ]);
        expect(DiagnosticEngine.getNextNode('math', '5', balanced)).toBeNull();
    });

    it('expõe os limites de 8 a 12 microdesafios', () => {
        expect(DIAGNOSTIC_MIN_CHALLENGES).toBe(8);
        expect(DIAGNOSTIC_MAX_CHALLENGES).toBe(12);
    });

    it('libera apenas pré-requisitos comprovados, sem declarar o nó testado dominado', () => {
        const placement = DiagnosticEngine.applyPlacement({}, [{
            nodeId: 'add_two_digits', skillId: 'math_basic', isCorrect: true, supportLevel: 'none'
        }], '2026-07-18T00:00:00.000Z');

        expect(placement.add_simple).toMatchObject({ placementPassed: true, mastered: false });
        expect(placement.add_two_digits).toBeUndefined();
        expect(placement.__diagnostic_math_v2?.diagnosticVersion).toBe('v2');
    });
});
