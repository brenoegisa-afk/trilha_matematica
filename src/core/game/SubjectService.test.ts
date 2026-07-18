import { describe, expect, it } from 'vitest';
import { getDueReviewNode } from './SubjectService';
import type { Player } from '../types';

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
