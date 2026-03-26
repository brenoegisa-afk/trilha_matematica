import type { Question, Player, TileType } from '../types';
import { SubjectService } from '../game/SubjectService';

/**
 * ReinforcementEngine
 * Generates reinforcement questions when a player makes a mistake.
 * A reinforcement question should ideally be slightly easier or test the same skill 
 * with different numbers/format to ensure the concept was understood after the explanation.
 */
export class ReinforcementEngine {
    private static subjectService = new SubjectService();

    /**
     * Generates a reinforcement question based on the failed question.
     */
    public static generateReinforcement(failedQuestion: Question, player: Player, subjectId: string, grade: string, tileType: TileType): Question {
        // Log the failed skill to potentially use it in the future
        console.log(`Generating reinforcement for skill: ${failedQuestion.skillId}`);

        // For Math, we can dynamically generate an easier version
        if (subjectId === 'math') {
            // Temporarily trick the MathEngine into generating an easier question by passing a mocked player with 0 streak
            const easierPlayer = { ...player, streak: 0, sessionStats: { ...player.sessionStats, correctAnswers: 0 } };
            
            const newQ = this.subjectService.getQuestion(subjectId, grade, tileType, easierPlayer);
            return {
                ...newQ,
                isReinforcement: true,
                explanation: undefined // Clean explanation from the new question
            };
        }

        // For static subjects (Portuguese/Science), we just grab a different question from the same skill if possible,
        // or just another question from the same subject/tile.
        const newQ = this.subjectService.getQuestion(subjectId, grade, tileType, player);
        return {
            ...newQ,
            isReinforcement: true,
            explanation: undefined
        };
    }
}
