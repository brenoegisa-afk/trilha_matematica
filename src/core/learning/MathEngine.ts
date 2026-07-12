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

// Concordância de número: "1 maçã" vs "2 maçãs".
const plural = (n: number, singular: string, plural: string) =>
    `${n} ${n === 1 ? singular : plural}`;

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

// Embaralha um array (Fisher-Yates) — para variar a posição da resposta certa.
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Garante 4 opções de fração únicas (incluindo a correta), embaralhadas.
function makeFractionOptions(answer: string, distractors: string[]): string[] {
    const set = new Set<string>([answer, ...distractors]);
    const [num, den] = answer.split('/').map(Number);
    let guard = 0;
    while (set.size < 4 && guard < 30) {
        const dn = Math.max(2, den + randomInt(-1, 2));
        const nn = Math.max(1, Math.min(dn, num + randomInt(-2, 2)));
        set.add(`${nn}/${dn}`);
        guard++;
    }
    return shuffle(Array.from(set).slice(0, 4));
}

// ═══════════════════════════════════════════════════════════
// GERADORES POR NÓ
// ═══════════════════════════════════════════════════════════

const NODE_GENERATORS: Record<string, NodeGenerator> = {
    // ─── SOMA ───
    add_simple: (node) => {
        const a = randomInt(1, 5), b = randomInt(1, 5);
        return {
            question: `🍎 Ana tem ${plural(a, 'maçã', 'maçãs')} e ganhou mais ${b}. Com quantas ficou?`,
            answer: String(a + b),
            options: makeNumericOptions(a + b, 'add'),
            skillId: node.skillId, bnccCode: node.bnccCode,
            explanation: { title: `Vamos contar juntos!`, steps: [`Você tinha ${plural(a, 'maçã', 'maçãs')}.`, `Ganhou mais ${b}.`, `${a} + ${b} = ${a + b} maçãs no total!`] }
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
            question: `🐦 Havia ${a} pássaros no galho. ${b === 1 ? '1 voou' : b + ' voaram'}. Quantos ficaram?`,
            answer: String(a - b),
            options: makeNumericOptions(a - b, 'sub'),
            skillId: node.skillId, bnccCode: node.bnccCode,
            explanation: { title: `Tirando da conta`, steps: [`Começamos com ${a} pássaros.`, `${b === 1 ? '1 foi embora' : b + ' foram embora'}.`, `${a} - ${b} = ${a - b} pássaros restantes.`] }
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
        const a = randomInt(11, 25), b = randomInt(11, 19);
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
        // 4 decimais DISTINTOS (evita empate no "menor" e garante 4 alternativas).
        const set = new Set<number>();
        while (set.size < 4) set.add(parseFloat((randomInt(10, 59) / 10).toFixed(1)));
        const nums = Array.from(set);
        const answer = Math.min(...nums).toFixed(1);
        return {
            question: `📊 Qual é o menor número? ${nums.map(n => n.toFixed(1)).join('  |  ')}`,
            answer,
            // Embaralha para a resposta certa não cair sempre na mesma posição.
            options: shuffle(nums.map(n => n.toFixed(1))),
            skillId: node.skillId, bnccCode: node.bnccCode,
            explanation: { title: `Comparando decimais`, steps: [`Compare a parte inteira primeiro.`, `Se iguais, compare as casas decimais.`, `O menor é ${answer}.`] }
        };
    },

    // ─── FRAÇÕES (procedurais: variam a cada questão) ───
    frac_intro: (node) => {
        const foods = [
            { emoji: '🍕', item: 'Uma pizza', verb: 'foi cortada' },
            { emoji: '🍫', item: 'Uma barra de chocolate', verb: 'foi dividida' },
            { emoji: '🎂', item: 'Um bolo', verb: 'foi cortado' },
            { emoji: '🍉', item: 'Uma melancia', verb: 'foi cortada' },
        ];
        const f = foods[randomInt(0, foods.length - 1)];
        const den = randomInt(3, 8);
        const num = randomInt(1, den - 1);
        const answer = `${num}/${den}`;
        const options = makeFractionOptions(answer, [`${den}/${num}`, `${num}/${den + 1}`, `${num + 1}/${den}`]);
        return {
            question: `${f.emoji} ${f.item} ${f.verb} em ${den} partes iguais. Alguém comeu ${plural(num, 'parte', 'partes')}. Que fração foi comida?`,
            answer,
            options,
            skillId: node.skillId, bnccCode: node.bnccCode,
            explanation: { title: `Entendendo frações`, steps: [`São ${den} partes iguais (denominador = ${den}).`, `Foram comidas ${num} (numerador = ${num}).`, `A fração é ${num}/${den}.`] }
        };
    },
    frac_equiv: (node) => {
        const den = randomInt(2, 5);
        const factor = randomInt(2, 4);
        const answer = `${factor}/${den * factor}`;
        const options = makeFractionOptions(answer, [`1/${den + 1}`, `${factor}/${den * factor + 1}`, `${factor + 1}/${den * factor}`]);
        return {
            question: `⚖️ Qual fração é equivalente a 1/${den}?`,
            answer,
            options,
            skillId: node.skillId, bnccCode: node.bnccCode,
            explanation: { title: `Frações equivalentes`, steps: [`Multiplique numerador e denominador por ${factor}.`, `1 × ${factor} / ${den} × ${factor} = ${factor}/${den * factor}`, `Portanto 1/${den} = ${factor}/${den * factor} ✅`] }
        };
    },
    frac_operations: (node) => {
        // Mesma "quantia de partes" (mesmo denominador): soma só os numeradores.
        const den = randomInt(4, 9);
        const a = randomInt(1, den - 2);
        const b = randomInt(1, den - 1 - a);
        const answer = `${a + b}/${den}`;
        const options = makeFractionOptions(answer, [`${a + b}/${den + den}`, `${a + b + 1}/${den}`, `${a + b}/${den + 1}`]);
        return {
            question: `🔢 Quanto é ${a}/${den} + ${b}/${den}?`,
            answer,
            options,
            skillId: node.skillId, bnccCode: node.bnccCode,
            explanation: { title: `Somando frações`, steps: [`Os denominadores são iguais (${den}).`, `Some só os numeradores: ${a} + ${b} = ${a + b}.`, `Resultado: ${a + b}/${den}. Nunca some os denominadores!`] }
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
        const q = generator ? generator(node) : generateFallback(node);
        // Carimba o nó de origem para que o loop de jogo saiba qual maestria atualizar.
        return { ...q, nodeId: node.id };
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
