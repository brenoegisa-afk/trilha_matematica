import type { Question } from '../types';

/**
 * ExplanationEngine
 * Automates the generation of pedagogical explanations for common mathematical patterns.
 * This turns every question into a learning opportunity without manual database editing.
 */
export class ExplanationEngine {
    /**
     * Enhances a question with a dynamic explanation if one doesn't exist.
     */
    public static enhance(question: Question): Question {
        if (question.explanation) return question;

        const dynamicExplanation = this.generateExplanation(question.question, question.answer);
        if (dynamicExplanation) {
            return { ...question, explanation: dynamicExplanation };
        }

        return question;
    }

    private static generateExplanation(text: string, answer: string): string | null {
        // Pattern 1: Simple Addition (e.g., "Quanto é 34 + 44?", "Some: 10 + 5 = ?", "6 + 4")
        const addMatch = text.match(/(\d+)\s*\+\s*(\d+)/);
        if (addMatch) {
            const a = parseInt(addMatch[1]);
            const b = parseInt(addMatch[2]);
            if (a < 10 && b < 10) return `Dica: Você pode usar os dedos ou contar a partir do ${Math.max(a, b)}. ${Math.max(a, b)} + ${Math.min(a, b)} é igual a ${answer}!`;
            return `Dica para somar ${a} e ${b}: Tente somar as dezenas primeiro (${Math.floor(a/10)*10} + ${Math.floor(b/10)*10} = ${Math.floor(a/10)*10 + Math.floor(b/10)*10}) e depois as unidades (${a%10} + ${b%10} = ${a%10 + b%10}). O total é ${answer}!`;
        }

        // Pattern 2: Simple Subtraction (e.g., "Quanto é 15 - 6?")
        const subMatch = text.match(/(\d+)\s*-\s*(\d+)/);
        if (subMatch) {
            const a = parseInt(subMatch[1]);
            const b = parseInt(subMatch[2]);
            return `Para subtrair ${b} de ${a}, você pode pensar: quanto falta de ${b} para chegar em ${a}? O resultado é ${answer}.`;
        }

        // Pattern 3: Multiplication (e.g., "Quanto é 3 x 7?", "5 * 10")
        const multMatch = text.match(/(\d+)\s*[x\*]\s*(\d+)/i);
        if (multMatch) {
            const a = parseInt(multMatch[1]);
            const b = parseInt(multMatch[2]);
            if (a === 2 || b === 2) return `Multiplicar por 2 é o mesmo que dobrar o valor! O dobro de ${a === 2 ? b : a} é ${answer}.`;
            if (a === 10 || b === 10) return `Multiplicar por 10 é fácil: basta adicionar um zero ao final do número! ${a === 10 ? b : a} vira ${answer}.`;
            return `Multiplicar ${a} por ${b} é o mesmo que somar o número ${a}, ${b} vezes! O resultado é ${answer}.`;
        }

        return null;
    }
}
