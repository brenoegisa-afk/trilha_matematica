import { describe, it, expect } from 'vitest';
import { MathEngine } from '../core/learning/MathEngine';

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
