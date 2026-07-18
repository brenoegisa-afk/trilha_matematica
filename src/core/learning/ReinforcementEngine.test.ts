import { describe, expect, it } from 'vitest';
import { ReinforcementEngine } from './ReinforcementEngine';
import type { Player, Question } from '../types';

const player: Player = { id: 'p', name: 'P', color: 'r', avatar: '🙂', currentPosition: 0, inventoryProtectionCount: 0, score: 0, streak: 1, level: 1, xp: 0, achievements: [], hp: 100, maxHp: 100, mascots: [], skillsMastery: [], srsReviews: [], sessionStats: { totalQuestions: 0, correctAnswers: 0, skillsPracticed: {} } };
const failed: Question = { question: '3 + 4?', answer: '7', options: ['7'], nodeId: 'add_simple', skillId: 'math_basic' };

describe('ReinforcementEngine', () => {
    it('mantém o nodeId da questão que falhou', () => {
        const reinforcement = ReinforcementEngine.generateReinforcement(failed, player, 'math', '1', 'Green');
        expect(reinforcement.nodeId).toBe('add_simple');
        expect(reinforcement.isReinforcement).toBe(true);
        expect(reinforcement.options).toHaveLength(2);
        expect(reinforcement.options).toContain(reinforcement.answer);
    });
});
