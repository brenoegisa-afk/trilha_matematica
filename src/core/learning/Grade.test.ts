import { describe, expect, it } from 'vitest';
import { getLegacyContentGrade, matchesGradeSelection, normalizeGrade } from './Grade';

describe('Grade compatibility', () => {
    it('normaliza seleções legadas sem invalidar chamadas existentes', () => {
        expect(normalizeGrade('1-2')).toBe('1');
        expect(normalizeGrade('3-4')).toBe('3');
        expect(normalizeGrade('5')).toBe('5');
    });

    it('resolve anos individuais para os pools de conteúdo legados', () => {
        expect(getLegacyContentGrade('1')).toBe('1-2');
        expect(getLegacyContentGrade('2')).toBe('1-2');
        expect(getLegacyContentGrade('3')).toBe('3-4');
        expect(getLegacyContentGrade('4')).toBe('3-4');
        expect(getLegacyContentGrade('5')).toBe('5');
    });

    it('mantém compatibilidade com seleções agrupadas antigas', () => {
        expect(matchesGradeSelection('2', '1-2')).toBe(true);
        expect(matchesGradeSelection('4', '3-4')).toBe(true);
        expect(matchesGradeSelection('4', '3')).toBe(false);
    });
});
