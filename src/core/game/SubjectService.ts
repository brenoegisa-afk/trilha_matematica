import type { Question, Subject, Skill, Player } from '../types';
import questionsData from '../../data/questions.json';
import { ExplanationEngine } from './ExplanationEngine';
import { MathEngine } from '../learning/MathEngine';
import { CurriculumEngine } from '../learning/CurriculumEngine';
import { CurriculumGraph } from '../learning/CurriculumGraph';
import { getLegacyContentGrade } from '../learning/Grade';

// Quantas perguntas recentes lembramos por jogador para evitar repetição
// (ver MathEngine.generateFromNode). Não precisa ser grande: o objetivo é só
// não repetir a MESMA pergunta duas ou três vezes seguidas.
const RECENT_QUESTIONS_WINDOW = 6;
const RECENT_SESSION_WINDOW = 3;

export interface QuestionSelectionOptions {
    /**
     * Nos desafios do guardião a cor da casa define o encontro, não a matéria.
     * Sem este sinal, amarelo/vermelho forçavam lógica/expressões durante toda
     * a batalha e transformavam o combate em uma sequência do mesmo conteúdo.
     */
    balanceAcrossSkills?: boolean;
}

function rememberMathQuestion(player: Player, question: Question) {
    player.recentQuestions = [...(player.recentQuestions || []), question.question].slice(-RECENT_QUESTIONS_WINDOW);
    if (question.nodeId) player.recentNodeIds = [...(player.recentNodeIds || []), question.nodeId].slice(-RECENT_SESSION_WINDOW);
    if (question.skillId) player.recentSkillIds = [...(player.recentSkillIds || []), question.skillId].slice(-RECENT_SESSION_WINDOW);
}

export function getDueReviewNode(player: Player | undefined, subjectId: string) {
    if (!player?.nodeMastery) return null;
    const now = Date.now();
    const due = Object.values(player.nodeMastery)
        .filter(item => item.reviewDueAt && new Date(item.reviewDueAt).getTime() <= now)
        .map(item => ({ item, node: CurriculumGraph.getNode(item.nodeId) }))
        .filter((entry): entry is { item: NonNullable<typeof entry.item>; node: NonNullable<typeof entry.node> } =>
            !!entry.node && entry.node.subjectId === subjectId
        )
        .sort((a, b) => new Date(a.item.reviewDueAt!).getTime() - new Date(b.item.reviewDueAt!).getTime());
    return due[0]?.node || null;
}

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
    public getQuestion(
        subjectId: string,
        grade: string,
        tileType: string,
        player?: Player,
        forcedSkillId?: string,
        options: QuestionSelectionOptions = {}
    ): Question {
        // Intercept math subject for dynamic procedural generation
        if (subjectId === 'math') {
            const dueNode = getDueReviewNode(player, subjectId);
            if (dueNode) {
                const q = MathEngine.generateFromNode(dueNode, player?.recentQuestions || []);
                q.isReview = true;
                if (player) rememberMathQuestion(player, q);
                return q;
            }
            let potentialSkillId = forcedSkillId;
            if (!forcedSkillId && !options.balanceAcrossSkills) {
                if (tileType === 'Yellow') potentialSkillId = 'math_logic';
                else if (tileType === 'Red') potentialSkillId = 'math_expressions';
                else potentialSkillId = 'math_basic';
            }

            if (player) {
                const node = CurriculumEngine.pickNode(player, subjectId, potentialSkillId, grade, {
                    recentNodeIds: player.recentNodeIds,
                    recentSkillIds: player.recentSkillIds,
                    skillAttempts: Object.fromEntries(Object.entries(player.sessionStats.skillsPracticed || {})
                        .map(([skillId, stats]) => [skillId, stats.attempts]))
                });
                const q = MathEngine.generateFromNode(node, player.recentQuestions || []);
                // Guarda as últimas perguntas DESSE jogador pra não repetir de novo
                // logo em seguida (ver MathEngine.generateFromNode).
                rememberMathQuestion(player, q);
                return q;
            } else {
                return MathEngine.generate(grade, tileType, player, potentialSkillId);
            }
        }

        // Navigate the static structure for other subjects (Portuguese/Science)
        const subjectPool = (questionsData.subjects as any)[subjectId];
        const legacyGrade = getLegacyContentGrade(grade);
        
        if (subjectPool && subjectPool.grades && subjectPool.grades[legacyGrade]) {
            const tilePool = subjectPool.grades[legacyGrade][tileType];
            
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
