import type { Question, StructuredExplanation } from '../types';

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

        // Fallback for subjects without dynamic logic (pt/sci)
        return { 
            ...question, 
            explanation: {
                title: 'Não se preocupe em errar!',
                steps: [
                    'O erro faz parte do aprendizado.',
                    `A resposta correta era: ${question.answer}.`,
                    'Preste atenção para não errar a próxima!'
                ]
            }
        };
    }

    private static generateExplanation(text: string, answer: string): StructuredExplanation | null {
        // Pattern 1: Simple Addition
        const addMatch = text.match(/(\d+)\s*\+\s*(\d+)/);
        if (addMatch) {
            const a = parseInt(addMatch[1]);
            const b = parseInt(addMatch[2]);
            if (a < 10 && b < 10) {
                return {
                    title: 'Dica de Soma Rápida',
                    steps: [
                        `Guarde o número maior (${Math.max(a, b)}) na cabeça.`,
                        `Levante ${Math.min(a, b)} dedos na mão e conte a partir do ${Math.max(a, b)}...`,
                        `O resultado final é ${answer}!`
                    ]
                };
            }
            return {
                title: 'Somando Números Grandes',
                steps: [
                    `Vamos dividir o problema: sume as dezenas primeiro (${Math.floor(a/10)*10} + ${Math.floor(b/10)*10} = ${Math.floor(a/10)*10 + Math.floor(b/10)*10}).`,
                    `Agora some as unidades separadamente (${a%10} + ${b%10} = ${a%10 + b%10}).`,
                    `Junte os dois resultados e você terá ${answer}!`
                ]
            };
        }

        // Pattern 2: Simple Subtraction
        const subMatch = text.match(/(\d+)\s*-\s*(\d+)/);
        if (subMatch) {
            const a = parseInt(subMatch[1]);
            const b = parseInt(subMatch[2]);
            return {
                title: 'Entendendo a Subtração',
                steps: [
                    `Na subtração, pense no quanto falta para o menor chegar no maior.`,
                    `Conte a partir de ${b} até chegar em ${a}.`,
                    `A diferença entre eles é exatamente ${answer}.`
                ]
            };
        }

        // Pattern 3: Multiplication
        const multMatch = text.match(/(\d+)\s*[x\*]\s*(\d+)/i);
        if (multMatch) {
            const a = parseInt(multMatch[1]);
            const b = parseInt(multMatch[2]);
            if (a === 2 || b === 2) {
                return {
                    title: 'O Dobro',
                    steps: [
                        `Multiplicar por 2 é exatamente o mesmo que "dobrar" o número!`,
                        `Pense em somar o número a ele mesmo: ${a === 2 ? b : a} + ${a === 2 ? b : a}.`,
                        `O resultado final é ${answer}.`
                    ]
                };
            }
            if (a === 10 || b === 10) {
                return {
                    title: 'Regra do Dez',
                    steps: [
                        `Para multiplicar por 10, basta pegar o número original (${a === 10 ? b : a}).`,
                        `Cole um 0 (zero) no final dele.`,
                        `Pronto! O resultado é ${answer}. Viu como é fácil?`
                    ]
                };
            }
            return {
                title: 'O Segredo da Multiplicação',
                steps: [
                    `Multiplicar é uma forma rápida de somar!`,
                    `Isso significa que você pega o número ${a} e soma ele com ele mesmo ${b} vezes.`,
                    `Por exemplo: ${a} + ${a} + ... (${b} vezes). O total é ${answer}.`
                ]
            };
        }

        return null; // Let the fallback handle unknown patterns
    }
}
