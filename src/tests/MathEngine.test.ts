import { describe, it, expect } from 'vitest';
import { MathEngine } from '../core/learning/MathEngine';
import { CurriculumGraph } from '../core/learning/CurriculumGraph';

describe('MathEngine', () => {
    it('generates a basic addition or subtraction for grade 1-2 correctly', () => {
        const q = MathEngine.generate('1-2', 'Normal');
        
        expect(q.options).toHaveLength(4);
        expect(q.options).toContain(q.answer);
        expect(q.skillId).toBe('math_basic');
        expect(q.question).toMatch(/Quanto é/);
        
        // Assert answer is a valid number
        const answerNum = parseInt(q.answer, 10);
        expect(Number.isNaN(answerNum)).toBe(false);
    });

    it('generates a logical sequence for Yellow tiles', () => {
        const q = MathEngine.generate('3-4', 'Yellow');
        
        expect(q.skillId).toBe('math_logic');
        expect(q.question).toMatch(/Qual é o próximo número da sequência/);
        expect(q.options).toContain(q.answer);
    });

    it('generates a multiplication for grade 5 on Red tiles', () => {
        const q = MathEngine.generate('5', 'Red');
        
        expect(q.skillId).toBe('math_expressions');
        expect(q.question).toMatch(/x/); // Multiplication sign expected
        expect(q.options).toContain(q.answer);
    });
    
    it('always generates 4 unique options', () => {
        const q = MathEngine.generate('5', 'Green');
        const uniqueSet = new Set(q.options);
        expect(uniqueSet.size).toBe(4);
    });
});

describe('MathEngine.generateFromNode — anti-repetição', () => {
    const node = CurriculumGraph.getNode('add_two_digits')!; // range mais largo (evita colisão por acaso)

    it('evita repetir uma pergunta que está na lista "avoid" quando há alternativa', () => {
        // Gera uma primeira pergunta, tenta gerar de novo evitando-a — como o
        // range de add_two_digits (até 20) tem muitas combinações, a segunda
        // tentativa praticamente sempre acha algo diferente.
        const first = MathEngine.generateFromNode(node);
        let sawDifferent = false;
        for (let i = 0; i < 20; i++) {
            const next = MathEngine.generateFromNode(node, [first.question]);
            if (next.question !== first.question) { sawDifferent = true; break; }
        }
        expect(sawDifferent).toBe(true);
    });

    it('não trava em loop infinito mesmo se "avoid" cobrir quase tudo', () => {
        // avoid absurdamente grande (nunca vai bater) só garante que o método
        // sempre retorna algo, não fica girando pra sempre.
        const q = MathEngine.generateFromNode(node, ['pergunta que nunca existe']);
        expect(q.question).toBeTruthy();
        expect(q.nodeId).toBe('add_two_digits');
    });

    it('atribui uma referência diferente para itens diferentes do mesmo nó', () => {
        const first = MathEngine.generateFromNode(node);
        let different: typeof first | undefined;

        for (let i = 0; i < 30; i++) {
            const next = MathEngine.generateFromNode(node, [first.question]);
            if (next.question !== first.question) {
                different = next;
                break;
            }
        }

        expect(first.questionRef).toMatch(/^add_two_digits:/);
        expect(different?.questionRef).toBeTruthy();
        expect(different?.questionRef).not.toBe(first.questionRef);
    });
});
