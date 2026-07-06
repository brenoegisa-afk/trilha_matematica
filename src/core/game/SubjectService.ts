import type { Question, Subject, Skill, Player } from '../types';
import questionsData from '../../data/questions.json';
import { ExplanationEngine } from './ExplanationEngine';
import { MathEngine } from '../learning/MathEngine';
import { CurriculumEngine } from '../learning/CurriculumEngine';

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
    public getQuestion(subjectId: string, grade: string, tileType: string, player?: Player, forcedSkillId?: string): Question {
        // Intercept math subject for dynamic procedural generation
        if (subjectId === 'math') {
            let potentialSkillId = forcedSkillId;
            if (!forcedSkillId) {
                if (tileType === 'Yellow') potentialSkillId = 'math_logic';
                else if (tileType === 'Red') potentialSkillId = 'math_expressions';
                else potentialSkillId = 'math_basic';
            }

            if (player) {
                const node = CurriculumEngine.pickNode(player, subjectId, potentialSkillId);
                return MathEngine.generateFromNode(node);
            } else {
                return MathEngine.generate(grade, tileType, player, potentialSkillId);
            }
        }

        // Navigate the static structure for other subjects (Portuguese/Science)
        const subjectPool = (questionsData.subjects as any)[subjectId];
        
        if (subjectPool && subjectPool.grades && subjectPool.grades[grade]) {
            const tilePool = subjectPool.grades[grade][tileType];
            
            if (tilePool && tilePool.length > 0) {
                const q = tilePool[Math.floor(Math.random() * tilePool.length)];
                
                // Injetar Skill baseada na matéria e cor (Fallback inteligente)
                let skillId = forcedSkillId || 'port_grammar';
                if (!forcedSkillId && subjectId === 'science') skillId = 'sci_nature';
                
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
