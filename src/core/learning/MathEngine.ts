import type { Question, Player } from '../types';

export class MathEngine {
    static generate(grade: string, tileType: string, player?: Player): Question {
        const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
        
        let questionText = '';
        let answer = 0;
        let skillId = 'math_basic';
        
        // Determinar range baseado na série
        let maxNumber = 10;
        if (grade === '3-4') maxNumber = 50;
        if (grade === '5') maxNumber = 100;

        // --- Adaptive Logic ---
        // If the player is struggling with the skill, we reduce the max number
        // to provide an easier "remediation" question.
        // We'll determine the skillId early to check stats.
        let potentialSkillId = 'math_basic';
        if (tileType === 'Yellow') potentialSkillId = 'math_logic';
        else if (tileType === 'Red') potentialSkillId = 'math_expressions';

        if (player) {
            const stats = player.sessionStats.skillsPracticed[potentialSkillId];
            // If they have at least 2 attempts and less than 50% success
            if (stats && stats.attempts >= 2 && (stats.successes / stats.attempts) < 0.5) {
                maxNumber = Math.max(10, Math.floor(maxNumber * 0.5));
            }
        }

        // Tile Type influences operation/difficulty
        if (tileType === 'Yellow') {
            // Logic / Sequences / Word Problems
            skillId = 'math_logic';
            const start = randomInt(1, maxNumber / 2);
            const step = randomInt(2, 5);
            const seq = [start, start + step, start + step * 2];
            answer = start + step * 3;
            questionText = `Qual é o próximo número da sequência: ${seq.join(', ')}?`;
        } else if (tileType === 'Red') {
            // Harder / Multiplication for older grades
            skillId = 'math_expressions';
            if (grade === '1-2') {
                const a = randomInt(5, 15);
                const b = randomInt(5, 15);
                answer = a + b;
                questionText = `Desafio Rápido: Somando ${a} + ${b} dá quanto?`;
            } else {
                const a = randomInt(2, 9);
                const b = randomInt(2, 9);
                answer = a * b;
                questionText = `Quanto é ${a} x ${b}?`;
            }
        } else {
            // Green/Blue/Normal - Standard operations
            const operations = ['+', '-'];
            const op = operations[randomInt(0, 1)];
            
            let a = randomInt(1, maxNumber);
            let b = randomInt(1, maxNumber);
            
            if (op === '-') {
                // Ensure positive results
                if (b > a) [a, b] = [b, a];
                if (a === b) a += 1; // Avoid 0 for better options generation
                answer = a - b;
                questionText = `Quanto é ${a} - ${b}?`;
            } else {
                answer = a + b;
                questionText = `Quanto é ${a} + ${b}?`;
            }
        }

        // Generate options (1 correct, 3 wrong)
        let optionsSet = new Set<number>();
        optionsSet.add(answer);
        
        while(optionsSet.size < 4) {
            const offset = randomInt(-5, 5);
            const wrongAns = answer + offset;
            if (wrongAns !== answer && wrongAns > 0) {
                optionsSet.add(wrongAns);
            }
        }
        
        const optionsArray = Array.from(optionsSet).sort((a,b) => a-b).map(String);
        
        return {
            question: questionText,
            answer: String(answer),
            options: optionsArray,
            skillId: skillId,
            explanation: `A resposta correta da operação é ${answer}.`
        };
    }
}
