import type { Question, Subject, Skill, Player } from '../types';
import questionsData from '../../data/questions.json';
import { ExplanationEngine } from './ExplanationEngine';
import { MathEngine } from '../learning/MathEngine';

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
    public getQuestion(subjectId: string, grade: string, tileType: string, player?: Player): Question {
        // Intercept math subject for dynamic procedural generation
        if (subjectId === 'math') {
            const dynamicQ = MathEngine.generate(grade, tileType, player);
            return dynamicQ; // MathEngine already formats strings and assigns explicit skills
        }

        // Navigate the static structure for other subjects (Portuguese/Science)
        const subjectPool = (questionsData.subjects as any)[subjectId];
        
        if (subjectPool && subjectPool.grades && subjectPool.grades[grade]) {
            const tilePool = subjectPool.grades[grade][tileType];
            
            if (tilePool && tilePool.length > 0) {
                const q = tilePool[Math.floor(Math.random() * tilePool.length)];
                
                // Injetar Skill baseada na matéria e cor (Fallback inteligente)
                let skillId = 'port_grammar';
                if (subjectId === 'science') skillId = 'sci_nature';
                
                return ExplanationEngine.enhance({ ...q, skillId });
            }
        }

        // Fallback robusto
        return ExplanationEngine.enhance({
            question: "Qual a primeira letra de ABA?",
            answer: "A",
            options: ["A", "B", "C", "D"],
            skillId: 'port_grammar'
        });
    }
}
