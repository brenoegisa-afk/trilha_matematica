import type { Question, Player, TileType } from '../types';

export class QuestionEngine {
    private usedQuestionIds: Set<string> = new Set();

    constructor() {}

    public getNextQuestion(
        pool: Record<string, Record<string, Question[]>>, 
        selectedGrade: string, 
        tileType: TileType, 
        players: Player[], 
        currentPlayerIndex: number
    ): Question {
        const currentPlayer = players[currentPlayerIndex];
        const leaderPosition = Math.max(...players.map(p => p.currentPosition));
        const isLaggingBehind = (leaderPosition - currentPlayer.currentPosition) > 6;

        let gradeToUse = selectedGrade;
        if (isLaggingBehind && selectedGrade !== '1-2') {
            gradeToUse = '1-2';
        }

        let questionsArray: Question[] = [];
        const allGrades = pool as Record<string, Record<string, Question[]>>;

        if (gradeToUse === '5') {
            ['1-2', '3-4', '5'].forEach(g => {
                if (allGrades[g]?.[tileType]) questionsArray.push(...allGrades[g][tileType]);
            });
        } else if (gradeToUse === '3-4') {
            ['1-2', '3-4'].forEach(g => {
                if (allGrades[g]?.[tileType]) questionsArray.push(...allGrades[g][tileType]);
            });
        } else {
            if (allGrades['1-2']?.[tileType]) {
                questionsArray = [...allGrades['1-2'][tileType]];
            }
        }

        if (questionsArray.length === 0) {
            return {
                question: "Curinga! Role novamente na próxima rodada.",
                answer: "OK",
                options: ["OK"]
            };
        }

        const randomQ = questionsArray[Math.floor(Math.random() * questionsArray.length)];
        return randomQ;
    }

    public clearCache(): void {
        this.usedQuestionIds.clear();
    }
}
