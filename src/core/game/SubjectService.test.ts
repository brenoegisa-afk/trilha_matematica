import { describe, expect, it, vi } from 'vitest';
import { getDueReviewNode, SubjectService } from './SubjectService';
import type { Player } from '../types';
import { CurriculumEngine } from '../learning/CurriculumEngine';
import { CurriculumGraph } from '../learning/CurriculumGraph';

const player = (reviewDueAt: string): Player => ({
    id: 'p', name: 'P', color: 'r', avatar: '🙂', currentPosition: 0, inventoryProtectionCount: 0,
    score: 0, streak: 0, level: 1, xp: 0, achievements: [], hp: 100, maxHp: 100, mascots: [],
    skillsMastery: [], srsReviews: [], sessionStats: { totalQuestions: 0, correctAnswers: 0, skillsPracticed: {} },
    nodeMastery: { add_simple: { nodeId: 'add_simple', points: 250, attempts: 5, successes: 5, mastered: true, reviewDueAt } }
});

describe('getDueReviewNode', () => {
    it('prioriza um nó vencido do mesmo assunto', () => {
        expect(getDueReviewNode(player('2020-01-01T00:00:00.000Z'), 'math')?.id).toBe('add_simple');
    });
    it('ignora uma revisão futura', () => {
        expect(getDueReviewNode(player('2999-01-01T00:00:00.000Z'), 'math')).toBeNull();
    });
});

describe('SubjectService.getQuestion', () => {
    it('não deixa a cor da casa travar o eixo durante uma batalha comum', () => {
        const playerWithoutReview = player('2999-01-01T00:00:00.000Z');
        playerWithoutReview.nodeMastery = {};
        const spy = vi.spyOn(CurriculumEngine, 'pickNode').mockReturnValue(CurriculumGraph.getNode('add_simple')!);

        new SubjectService().getQuestion('math', '5', 'Yellow', playerWithoutReview, undefined, {
            balanceAcrossSkills: true
        });

        expect(spy).toHaveBeenCalledWith(
            playerWithoutReview,
            'math',
            undefined,
            '5',
            expect.any(Object)
        );
        spy.mockRestore();
    });

    it('mantém o foco explícito mesmo em uma batalha', () => {
        const playerWithoutReview = player('2999-01-01T00:00:00.000Z');
        playerWithoutReview.nodeMastery = {};
        const spy = vi.spyOn(CurriculumEngine, 'pickNode').mockReturnValue(CurriculumGraph.getNode('add_simple')!);

        new SubjectService().getQuestion('math', '5', 'Yellow', playerWithoutReview, 'math_expressions', {
            balanceAcrossSkills: true
        });

        expect(spy.mock.calls[0][2]).toBe('math_expressions');
        spy.mockRestore();
    });
});
