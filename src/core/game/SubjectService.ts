import type { Question, Subject, Skill } from '../types';
import questionsData from '../../data/questions.json';

// Extension of the current data structure to support subjects and skills
// In a real scenario, this would come from an API
export class SubjectService {
    private subjects: Subject[] = [
        { id: 'math', name: 'Matemática', icon: '🔢' },
        { id: 'portuguese', name: 'Português', icon: '📚' },
        { id: 'science', name: 'Ciências', icon: '🔬' }
    ];

    private skills: Skill[] = [
        { id: 'math_basic', name: 'Operações Básicas', subjectId: 'math' },
        { id: 'math_expressions', name: 'Expressões Numéricas', subjectId: 'math' },
        { id: 'math_logic', name: 'Raciocínio Lógico', subjectId: 'math' },
        { id: 'port_grammar', name: 'Gramática', subjectId: 'portuguese' },
        { id: 'sci_nature', name: 'Natureza', subjectId: 'science' }
    ];

    constructor() {}

    public getSubjects(): Subject[] {
        return this.subjects;
    }

    public getSkills(subjectId: string): Skill[] {
        return this.skills.filter(s => s.subjectId === subjectId);
    }

    /**
     * Adaptative question fetching
     * Bridges the old 'TileType' system with the new 'Skill' system
     */
    public getQuestion(subjectId: string, grade: string, tileType: string): Question {
        // Navigate the new structure: subjects -> subjectId -> grades -> grade -> pool
        const subjectPool = (questionsData.subjects as any)[subjectId];
        
        if (subjectPool && subjectPool.grades && subjectPool.grades[grade]) {
            const tilePool = subjectPool.grades[grade][tileType];
            
            if (tilePool && tilePool.length > 0) {
                const q = tilePool[Math.floor(Math.random() * tilePool.length)];
                
                // Injetar Skill baseada na matéria e cor (Fallback inteligente)
                let skillId = subjectId === 'math' ? 'math_basic' : 'port_grammar';
                if (subjectId === 'math') {
                    if (tileType === 'Green') skillId = 'math_expressions';
                    if (tileType === 'Yellow') skillId = 'math_logic';
                }
                
                return { ...q, skillId };
            }
        }

        // Fallback robusto
        return {
            question: subjectId === 'math' ? "Quanto é 1 + 1?" : "Qual a primeira letra de ABA?",
            answer: subjectId === 'math' ? "2" : "A",
            options: subjectId === 'math' ? ["1", "2", "3", "4"] : ["A", "B", "C", "D"],
            skillId: subjectId === 'math' ? 'math_basic' : 'port_grammar'
        };
    }
}
