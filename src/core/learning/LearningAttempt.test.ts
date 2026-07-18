import { describe, expect, it } from 'vitest';
import { toLearningAttemptRow } from './LearningAttempt';

describe('LearningAttempt contract', () => {
    it('preserva identificadores e limita dados de resposta/latência', () => {
        const row = toLearningAttemptRow({
            attemptId: '11111111-1111-4111-8111-111111111111',
            sessionId: '22222222-2222-4222-8222-222222222222',
            studentId: '33333333-3333-4333-8333-333333333333',
            gameMode: 'trilha',
            nodeId: 'add_simple',
            skillId: 'math_basic',
            questionRef: 'add_simple',
            generatorVersion: 'curriculum-v1',
            itemFormat: 'multiple_choice',
            selectedResponse: 'x'.repeat(250),
            isCorrect: true,
            responseLatencyMs: -15,
            attemptNumber: 0,
            hintCount: -1,
            supportLevel: 'none',
            occurredAt: '2026-07-18T12:00:00.000Z'
        });

        expect(row.attempt_id).toBe('11111111-1111-4111-8111-111111111111');
        expect(row.selected_response).toHaveLength(200);
        expect(row.response_latency_ms).toBe(0);
        expect(row.attempt_number).toBe(1);
        expect(row.hint_count).toBe(0);
    });
});
