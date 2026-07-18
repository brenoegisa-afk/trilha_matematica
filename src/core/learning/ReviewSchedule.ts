export const REVIEW_INTERVAL_DAYS = [1, 3, 7, 21] as const;

export interface ReviewSchedule {
    intervalIndex: number;
    reviewDueAt: string;
}

export function scheduleReview(now: Date, previous: ReviewSchedule | undefined, isCorrect: boolean, supportLevel: 'none' | 'hint' | 'visual' | 'worked_example' = 'none'): ReviewSchedule {
    const previousIndex = previous?.intervalIndex ?? -1;
    const independentSuccess = isCorrect && supportLevel === 'none';
    const intervalIndex = independentSuccess
        ? Math.min(REVIEW_INTERVAL_DAYS.length - 1, previousIndex + 1)
        : Math.max(0, previousIndex - 1);
    const due = new Date(now);
    due.setUTCDate(due.getUTCDate() + REVIEW_INTERVAL_DAYS[intervalIndex]);
    return { intervalIndex, reviewDueAt: due.toISOString() };
}
