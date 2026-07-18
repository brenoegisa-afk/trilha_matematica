export type LearningGameMode = 'trilha' | 'arena' | 'battle' | 'tabuada';

export interface LearningAttempt {
    attemptId: string;
    sessionId: string;
    studentId: string;
    classId?: string;
    gameMode: LearningGameMode;
    nodeId?: string;
    skillId?: string;
    factId?: string;
    questionRef?: string;
    generatorVersion: string;
    itemFormat: 'multiple_choice';
    selectedResponse: string;
    isCorrect: boolean;
    responseLatencyMs: number;
    attemptNumber: number;
    hintCount: number;
    supportLevel: 'none' | 'hint' | 'visual' | 'worked_example';
    misconceptionId?: string;
    occurredAt: string;
}

export function toLearningAttemptRow(attempt: LearningAttempt) {
    return {
        attempt_id: attempt.attemptId,
        session_id: attempt.sessionId,
        student_id: attempt.studentId,
        class_id: attempt.classId || null,
        game_mode: attempt.gameMode,
        node_id: attempt.nodeId || null,
        skill_id: attempt.skillId || null,
        fact_id: attempt.factId || null,
        question_ref: attempt.questionRef || null,
        generator_version: attempt.generatorVersion,
        item_format: attempt.itemFormat,
        selected_response: attempt.selectedResponse.slice(0, 200),
        is_correct: attempt.isCorrect,
        response_latency_ms: Math.max(0, Math.min(3600000, Math.round(attempt.responseLatencyMs))),
        attempt_number: Math.max(1, Math.round(attempt.attemptNumber)),
        hint_count: Math.max(0, Math.round(attempt.hintCount)),
        support_level: attempt.supportLevel,
        misconception_id: attempt.misconceptionId || null,
        occurred_at: attempt.occurredAt
    };
}
