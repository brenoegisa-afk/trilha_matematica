/**
 * Séries individuais usadas pela experiência do aluno.
 * Os pools de conteúdo legados ainda usam 1-2, 3-4 e 5; a conversão fica
 * centralizada aqui até que cada pool tenha conteúdo próprio por ano.
 */
export const GRADES = ['1', '2', '3', '4', '5'] as const;

export type Grade = typeof GRADES[number];
export type LegacyGrade = '1-2' | '3-4' | '5';
export type GradeSelection = Grade | LegacyGrade;

export function normalizeGrade(grade: string | undefined): Grade {
    if (grade === '2' || grade === '3' || grade === '4' || grade === '5') return grade;
    // Perfis, URLs e chamadas antigas continuam válidos durante a migração.
    if (grade === '3-4') return '3';
    return '1';
}

export function getLegacyContentGrade(grade: string | undefined): LegacyGrade {
    const normalized = normalizeGrade(grade);
    if (normalized === '1' || normalized === '2') return '1-2';
    if (normalized === '3' || normalized === '4') return '3-4';
    return '5';
}

export function matchesGradeSelection(nodeGrade: Grade, selection: string | undefined): boolean {
    if (selection === '1-2') return nodeGrade === '1' || nodeGrade === '2';
    if (selection === '3-4') return nodeGrade === '3' || nodeGrade === '4';
    return nodeGrade === normalizeGrade(selection);
}
