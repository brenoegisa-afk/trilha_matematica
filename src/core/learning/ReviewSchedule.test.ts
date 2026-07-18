import { describe, expect, it } from 'vitest';
import { scheduleReview } from './ReviewSchedule';

describe('scheduleReview', () => {
    const now = new Date('2026-07-18T12:00:00.000Z');
    it('agenda 1, 3, 7 e 21 dias após acertos independentes', () => {
        let review = scheduleReview(now, undefined, true);
        expect(review.reviewDueAt).toBe('2026-07-19T12:00:00.000Z');
        review = scheduleReview(now, review, true);
        expect(review.reviewDueAt).toBe('2026-07-21T12:00:00.000Z');
        review = scheduleReview(now, review, true);
        expect(review.reviewDueAt).toBe('2026-07-25T12:00:00.000Z');
        review = scheduleReview(now, review, true);
        expect(review.reviewDueAt).toBe('2026-08-08T12:00:00.000Z');
    });
    it('encurta após erro ou ajuda', () => {
        const previous = { intervalIndex: 2, reviewDueAt: '2026-07-25T12:00:00.000Z' };
        expect(scheduleReview(now, previous, false).intervalIndex).toBe(1);
        expect(scheduleReview(now, previous, true, 'hint').intervalIndex).toBe(1);
    });
});
