/**
 * MathEngine — Gerador Procedural de Questões de Matemática
 * 
 * Agora gera questões baseadas no NÓDULO CURRICULAR ativo do aluno,
 * em vez de apenas na série genérica. Cada nó tem sua própria lógica
 * de geração com ranges precisos e tipos de operação específicos.
 */

import type { Question, Player } from '../types';
import type { CurriculumNode } from './CurriculumGraph';

type NodeGenerator = (node: CurriculumNode) => Question;

const randomInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Gera opções plausíveis para uma resposta numérica.
 * As alternativas erradas mapeiam erros reais e comuns (distratores diagnósticos).
 */
function makeNumericOptions(answer: number, type: 'add' | 'sub' | 'mult' | 'div' | 'seq'): string[] {
    const set = new Set<number>();
    set.add(answer);

    if (type === 'add') {
        set.add(answer + 1);   // Esqueceu de somar 1
        set.add(answer - 1);   // Erro de contagem
        set.add(answer + 10);  // Confundiu dezena
    } else if (type === 'sub') {
        set.add(answer + 1);
        set.add(answer - 1);
        set.add(Math.abs(answer - 2)); // Inverteu minuendo e subtraendo
    } else if (type === 'mult') {
        set.add(answer + randomInt(1, 5));
        set.add(answer - randomInt(1, 5));
        set.add(answer * 2);   // Dobrou em vez de multiplicar
    } else if (type === 'div') {
        set.add(answer + 1);
        set.add(answer - 1);
        set.add(answer * 2);   // Multiplicou em vez de dividir
    } else { // seq
        set.add(answer + 1);
        set.add(answer - 1);
        set.add(answer + 2);
    }

    // Garante 4 opções únicas e positivas
    const arr = Array.from(set).filter(n => n > 0).slice(0, 4);
    while (arr.length < 4) {
        const v = answer + randomInt(-6, 6);
        if (v > 0 && !arr.includes(v)) arr.push(v);
    }

    return arr.sort((a, b) => a - b).map(String);
}

// ═══════════════════════════════════════════════════════════
// GERADORES POR NÓ
// ═══════════════════════════════════════════════════════════

const NODE_GENERATORS: Record<string, NodeGenerator> = {
    // ─── SOMA ───
    add_simple: (node) => {
        const a = randomInt(1, 5), b = randomInt(1, 5);
        return {
            question: `🍎 Ana tem ${a} maçãs e ganhou mais ${b}. Com quantas ficou?`,
            answer: String(a + b),
            options: makeNumericOptions(a + b, 'add'),
            skillId: node.skillId, bnccCode: node.bnccCode,
            explanation: { title: `Vamos contar juntos!`, steps: [`Você tinha ${a} maçãs.`, `Ganhou mais ${b}.`, `${a} + ${b} = ${a + b} maçãs no total!`] }
        };
    },
    add_two_digits: (node) => {
        const a = randomInt(8, 15), b = randomInt(4, 10);
        return {
            question: `Quanto é ${a} + ${b}?`,
            answer: String(a + b),
            options: makeNumericOptions(a + b, 'add'),
            skillId: node.skillId, bnccCode: node.bnccCode,
            explanation: { title: `Somando dezenas`, steps: [`Primeiro somamos as unidades.`, `Depois as dezenas.`, `${a} + ${b} = ${a + b}`] }
        };
    },
    add_regroup: (node) => {
        const a = randomInt(17, 45), b = randomInt(8, 30);
        return {
            question: `Calcule: ${a} + ${b} = ?`,
            answer: String(a + b),
            options: makeNumericOptions(a + b, 'add'),
            skillId: node.skillId, bnccCode: node.bnccCode,
            explanation: { title: `Soma com vai-um`, steps: [`Some as unidades: ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)}`, `Reagrupe se passar de 9.`, `Some as dezenas com o vai-um.`, `Resultado: ${a + b}`] }
        };
    },
    add_three_digit: (node) => {
        const a = randomInt(100, 450), b = randomInt(50, 350);
        return {
            question: `${a} + ${b} = ?`,
            answer: String(a + b),
            options: makeNumericOptions(a + b, 'add'),
            skillId: node.skillId, bnccCode: node.bnccCode,
            explanation: { title: `Adição de centenas`, steps: [`Some coluna por coluna: unidades, dezenas, centenas.`, `Lembre do reagrupamento em cada etapa.`, `Resultado: ${a + b}`] }
        };
    },
    add_decimals: (node) => {
        const a = parseFloat((randomInt(10, 50) / 10).toFixed(1));
        const b = parseFloat((randomInt(5, 30) / 10).toFixed(1));
        const answer = parseFloat((a + b).toFixed(1));
        return {
            question: `Quanto é ${a} + ${b}?`,
            answer: String(answer),
            options: [String(answer), String(parseFloat((answer + 0.1).toFixed(1))), String(parseFloat((answer - 0.1).toFixed(1))), String(parseFloat((answer + 1).toFixed(1)))],
            skillId: node.skillId, bnccCode: node.bnccCode,
            explanation: { title: `Somando decimais`, steps: [`Alinhe a vírgula.`, `Some como inteiros.`, `Coloque a vírgula no resultado.`, `${a} + ${b} = ${answer}`] }
        };
    },
    multi_step: (node) => {
        const priceA = randomInt(2, 8), qtyA = randomInt(2, 4);
        const priceB = randomInt(1, 5), qtyB = randomInt(1, 3);
        const total = priceA * qtyA + priceB * qtyB;
        return {
            question: `🛒 Pedro comprou ${qtyA} cadernos por R$${priceA} cada e ${qtyB} lápis por R$${priceB} cada. Quanto gastou no total?`,
            answer: `R$${total}`,
            options: [`R$${total}`, `R$${total + priceA}`, `R$${total - priceB}`, `R$${priceA * qtyA}`],
            skillId: node.skillId, bnccCode: node.bnccCode,
            explanation: { title: `Problema em etapas`, steps: [`Cadernos: ${qtyA} × R$${priceA} = R$${priceA * qtyA}`, `Lápis: ${qtyB} × R$${priceB} = R$${priceB * qtyB}`, `Total: R$${priceA * qtyA} + R$${priceB * qtyB} = R$${total}`] }
        };
    },

    // ─── SUBTRAÇÃO ───
    sub_simple: (node) => {
        const a = randomInt(4, 10), b = randomInt(1, a - 1);
        return {
            question: `🐦 Havia ${a} pássaros no galho. ${b} voaram. Quantos ficaram?`,
            answer: String(a - b),
            options: makeNumericOptions(a - b, 'sub'),
            skillId: node.skillId, bnccCode: node.bnccCode,
            explanation: { title: `Tirando da conta`, steps: [`Começamos com ${a} pássaros.`, `${b} foram embora.`, `${a} - ${b} = ${a - b} pássaros restantes.`] }
        };
    },
    sub_two_digits: (node) => {
        const a = randomInt(12, 20), b = randomInt(3, a - 5);
        return {
            question: `Quanto é ${a} - ${b}?`,
            answer: String(a - b),
            options: makeNumericOptions(a - b, 'sub'),
            skillId: node.skillId, bnccCode: node.bnccCode,
            explanation: { title: `Subtraindo`, steps: [`Parta de ${a}.`, `Tire ${b}.`, `${a} - ${b} = ${a - b}`] }
        };
    },
    sub_borrow: (node) => {
        const a = randomInt(30, 60), b = randomInt(8, 25);
        return {
            question: `Calcule: ${a} - ${b} = ?`,
            answer: String(a - b),
            options: makeNumericOptions(a - b, 'sub'),
            skillId: node.skillId, bnccCode: node.bnccCode,
            explanation: { title: `Subtração com empréstimo`, steps: [`Verifique se pode subtrair as unidades.`, `Se não puder, "peça emprestado" da dezena.`, `${a} - ${b} = ${a - b}`] }
        };
    },
    sub_three_digit: (node) => {
        const b = randomInt(50, 300), a = b + randomInt(50, 200);
        return {
            question: `${a} - ${b} = ?`,
            answer: String(a - b),
            options: makeNumericOptions(a - b, 'sub'),
            skillId: node.skillId, bnccCode: node.bnccCode,
            explanation: { title: `Subtração de centenas`, steps: [`Subtraia coluna por coluna.`, `Empréstimo quando necessário.`, `${a} - ${b} = ${a - b}`] }
        };
    },

    // ─── MULTIPLICAÇÃO ───
    mult_intro: (node) => {
        const b = randomInt(2, 4), times = randomInt(2, 4);
        const answer = b * times;
        return {
            question: `🍊 Tenho ${times} grupos com ${b} laranjas cada. Quantas laranjas no total?`,
            answer: String(answer),
            options: makeNumericOptions(answer, 'mult'),
            skillId: node.skillId, bnccCode: node.bnccCode,
            explanation: { title: `Multiplicação = soma repetida`, steps: [`${times} grupos de ${b} = ${b} + ${b.toString().repeat(times - 1).split('').join(' + ')}`, `Ou seja: ${times} × ${b} = ${answer}`] }
        };
    },
    mult_tables: (node) => {
        const a = randomInt(2, 5), b = randomInt(2, 9);
        return {
            question: `Quanto é ${a} × ${b}?`,
            answer: String(a * b),
            options: makeNumericOptions(a * b, 'mult'),
            skillId: node.skillId, bnccCode: node.bnccCode,
            explanation: { title: `Tabuada do ${a}`, steps: [`${a} × ${b} = ${a * b}`, `Você pode confirmar: ${Array(b).fill(a).join(' + ')} = ${a * b}`] }
        };
    },
    mult_full: (node) => {
        const a = randomInt(6, 9), b = randomInt(3, 9);
        return {
            question: `${a} × ${b} = ?`,
            answer: String(a * b),
            options: makeNumericOptions(a * b, 'mult'),
            skillId: node.skillId, bnccCode: node.bnccCode,
            explanation: { title: `Tabuada completa`, steps: [`${a} × ${b} = ${a * b}`, `Dica: ${a} × ${b} = ${a} × (${b - 1}) + ${a} = ${a * (b - 1)} + ${a} = ${a * b}`] }
        };
    },
    mult_two_digit: (node) => {
        const a = randomInt(11, 25), b = randomInt(11, 15);
        return {
            question: `${a} × ${b} = ?`,
            answer: String(a * b),
            options: makeNumericOptions(a * b, 'mult'),
            skillId: node.skillId, bnccCode: node.bnccCode,
            explanation: { title: `Multiplicação por 2 dígitos`, steps: [`Multiplique por unidade: ${a} × ${b % 10} = ${a * (b % 10)}`, `Multiplique por dezena: ${a} × ${Math.floor(b / 10) * 10} = ${a * Math.floor(b / 10) * 10}`, `Some os resultados: ${a * b}`] }
        };
    },

    // ─── DIVISÃO ───
    div_intro: (node) => {
        const b = randomInt(2, 5), quotient = randomInt(2, 9);
        const a = b * quotient;
        return {
            question: `🍫 ${a} chocolates divididos em grupos de ${b}. Quantos grupos?`,
            answer: String(quotient),
            options: makeNumericOptions(quotient, 'div'),
            skillId: node.skillId, bnccCode: node.bnccCode,
            explanation: { title: `Divisão exata`, steps: [`Pergunta: quantas vezes ${b} cabe em ${a}?`, `${b} × ${quotient} = ${a}`, `Então: ${a} ÷ ${b} = ${quotient}`] }
        };
    },

    // ─── LÓGICA / SEQUÊNCIAS ───
    seq_simple: (node) => {
        const start = randomInt(1, 5), step = 1;
        const seq = [start, start + step, start + step * 2];
        const answer = start + step * 3;
        return {
            question: `Qual o próximo? ${seq.join(', ')}, __?`,
            answer: String(answer),
            options: makeNumericOptions(answer, 'seq'),
            skillId: node.skillId, bnccCode: node.bnccCode,
            explanation: { title: `Sequência crescente`, steps: [`Cada número aumenta ${step}.`, `Depois de ${seq[2]}, vem ${seq[2]} + ${step} = ${answer}`] }
        };
    },
    seq_pattern: (node) => {
        const start = randomInt(1, 6), step = randomInt(2, 5);
        const seq = [start, start + step, start + step * 2];
        const answer = start + step * 3;
        return {
            question: `Descubra o padrão: ${seq.join(', ')}, __?`,
            answer: String(answer),
            options: makeNumericOptions(answer, 'seq'),
            skillId: node.skillId, bnccCode: node.bnccCode,
            explanation: { title: `Encontrando o passo`, steps: [`${seq[1]} - ${seq[0]} = ${step}`, `O passo é +${step}.`, `${seq[2]} + ${step} = ${answer}`] }
        };
    },
    seq_mult: (node) => {
        const base = randomInt(2, 5);
        const seq = [base, base * 2, base * 3];
        const answer = base * 4;
        return {
            question: `📈 Sequência de múltiplos: ${seq.join(', ')}, __?`,
            answer: String(answer),
            options: makeNumericOptions(answer, 'seq'),
            skillId: node.skillId, bnccCode: node.bnccCode,
            explanation: { title: `Múltiplos`, steps: [`Esta é a tabuada do ${base}.`, `${base} × 4 = ${answer}`] }
        };
    },
    decimal_ordering: (node) => {
        const nums = [randomInt(10, 50) / 10, randomInt(10, 50) / 10, randomInt(10, 50) / 10]
            .map(n => parseFloat(n.toFixed(1)));
        const sorted = [...nums].sort((a, b) => a - b);
        const answer = sorted[0].toFixed(1);
        return {
            question: `📊 Qual é o menor número? ${nums.map(n => n.toFixed(1)).join('  |  ')}`,
            answer,
            options: nums.map(n => n.toFixed(1)).sort(),
            skillId: node.skillId, bnccCode: node.bnccCode,
            explanation: { title: `Comparando decimais`, steps: [`Compare a parte inteira primeiro.`, `Se iguais, compare as casas decimais.`, `O menor é ${answer}.`] }
        };
    },

    // ─── FRAÇÕES ───
    frac_intro: (node) => {
        const fracs = [['1/2', 'metade'], ['1/4', 'um quarto'], ['1/3', 'um terço']];
        const [frac, name] = fracs[randomInt(0, 2)];
        return {
            question: `🍕 Uma pizza foi cortada em 4 partes iguais. João comeu 1 parte. Que fração ele comeu?`,
            answer: '1/4',
            options: ['1/4', '1/2', '1/3', '2/4'],
            skillId: node.skillId, bnccCode: node.bnccCode,
            explanation: { title: `Entendendo frações`, steps: [`A pizza tem 4 partes iguais (denominador = 4).`, `João comeu 1 parte (numerador = 1).`, `A fração é 1/4.`] }
        };
    },
    frac_equiv: (node) => {
        return {
            question: `⚖️ Qual fração é equivalente a 1/2?`,
            answer: '2/4',
            options: ['2/4', '1/3', '3/5', '2/3'],
            skillId: node.skillId, bnccCode: node.bnccCode,
            explanation: { title: `Frações equivalentes`, steps: [`1/2 = quantos quartos?`, `Multiplique numerador e denominador por 2: 1×2 / 2×2 = 2/4`, `Portanto 1/2 = 2/4 ✅`] }
        };
    },
    frac_operations: (node) => {
        return {
            question: `🔢 Quanto é 1/2 + 1/4?`,
            answer: '3/4',
            options: ['3/4', '2/6', '1/2', '2/4'],
            skillId: node.skillId, bnccCode: node.bnccCode,
            explanation: { title: `Somando frações`, steps: [`Iguale os denominadores: 1/2 = 2/4`, `Agora some: 2/4 + 1/4 = 3/4`, `Nunca some os denominadores!`] }
        };
    },
};

// ═══════════════════════════════════════════════════════════
// FALLBACK para nós sem gerador específico
// ═══════════════════════════════════════════════════════════
function generateFallback(node: CurriculumNode): Question {
    const a = randomInt(1, 20), b = randomInt(1, 10);
    return {
        question: `Quanto é ${a} + ${b}?`,
        answer: String(a + b),
        options: makeNumericOptions(a + b, 'add'),
        skillId: node.skillId,
        bnccCode: node.bnccCode,
    };
}

// ═══════════════════════════════════════════════════════════
// API PÚBLICA
// ═══════════════════════════════════════════════════════════

export class MathEngine {
    /**
     * Gera uma questão baseada no nó curricular ativo do aluno.
     * Esta é a nova API principal — usa o grafo de progressão.
     */
    static generateFromNode(node: CurriculumNode): Question {
        const generator = NODE_GENERATORS[node.id];
        if (generator) {
            return generator(node);
        }
        return generateFallback(node);
    }

    /**
     * API legada — mantida por compatibilidade.
     * Gera uma questão genérica baseada na série e tipo de tile.
     * @deprecated Use generateFromNode() em vez disso.
     */
    static generate(grade: string, tileType: string, player?: Player, forcedSkillId?: string): Question {
        const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

        let maxNumber = 10;
        if (grade === '3-4') maxNumber = 50;
        if (grade === '5') maxNumber = 100;

        let potentialSkillId = forcedSkillId || 'math_basic';
        if (!forcedSkillId && tileType === 'Yellow') potentialSkillId = 'math_logic';
        if (!forcedSkillId && tileType === 'Red') potentialSkillId = 'math_expressions';

        if (player?.skillsMastery) {
            const mastery = player.skillsMastery.find(m => m.skillId === potentialSkillId);
            if (mastery) {
                if (mastery.points < 300) maxNumber = Math.max(10, Math.floor(maxNumber * 0.5));
                else if (mastery.points > 700) maxNumber = Math.floor(maxNumber * 1.5);
            }
        }

        let questionText = '', answer = 0, skillId = 'math_basic';

        if (potentialSkillId === 'math_logic') {
            skillId = 'math_logic';
            const start = randomInt(1, maxNumber / 2), step = randomInt(2, 5);
            const seq = [start, start + step, start + step * 2];
            answer = start + step * 3;
            questionText = `Qual é o próximo número da sequência: ${seq.join(', ')}?`;
        } else if (potentialSkillId === 'math_expressions') {
            skillId = 'math_expressions';
            if (grade === '1-2') {
                const a = randomInt(5, 15), b = randomInt(5, 15);
                answer = a + b;
                questionText = `Desafio Rápido: Somando ${a} + ${b} dá quanto?`;
            } else {
                const a = randomInt(2, 9), b = randomInt(2, 9);
                answer = a * b;
                questionText = `Quanto é ${a} x ${b}?`;
            }
        } else {
            const op = ['+', '-'][randomInt(0, 1)];
            let a = randomInt(1, maxNumber), b = randomInt(1, maxNumber);
            if (op === '-') {
                if (b > a) [a, b] = [b, a];
                if (a === b) a += 1;
                answer = a - b;
                questionText = `Quanto é ${a} - ${b}?`;
            } else {
                answer = a + b;
                questionText = `Quanto é ${a} + ${b}?`;
            }
        }

        let optionsSet = new Set<number>();
        optionsSet.add(answer);
        while (optionsSet.size < 4) {
            const wrong = answer + randomInt(-5, 5);
            if (wrong !== answer && wrong > 0) optionsSet.add(wrong);
        }

        return {
            question: questionText,
            answer: String(answer),
            options: Array.from(optionsSet).sort((a, b) => a - b).map(String),
            skillId,
            explanation: `A resposta correta é ${answer}.`
        };
    }
}
