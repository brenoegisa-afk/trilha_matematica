import type { Player, DiagnosticInsight, SkillStatus, NodeMastery } from '../types';
import { CurriculumGraph } from './CurriculumGraph';

export interface GraphNodeProgress {
    id: string;
    name: string;
    icon: string;
    bnccCode: string;
    accuracy: number;   // 0..1
    attempts: number;
    weakPrereqName?: string; // pré-requisito a reforçar (só para travados)
}

export interface GraphMisconception {
    nodeName: string;
    wrongAnswer: string;
    count: number;
}

export interface GraphProgress {
    mastered: GraphNodeProgress[];
    inProgress: GraphNodeProgress[];
    struggling: GraphNodeProgress[];
    misconceptions: GraphMisconception[];
    masteredCount: number;
    deepestMastered: number; // profundidade (ano) do nó dominado mais avançado
}

/**
 * DiagnosticService
 * Analyzes player's skill mastery to generate actionable insights and reports.
 */
export class DiagnosticService {
    /**
     * Traduz o node_mastery bruto do aluno numa visão pedagógica para o professor:
     * o que ele domina, o que está praticando, onde travou (com o pré-requisito a
     * reforçar) e quais equívocos cometeu (distratores escolhidos).
     */
    public static generateGraphProgress(nodeMastery: Record<string, NodeMastery>): GraphProgress {
        const mastered: GraphNodeProgress[] = [];
        const inProgress: GraphNodeProgress[] = [];
        const struggling: GraphNodeProgress[] = [];
        const misconceptions: GraphMisconception[] = [];
        let deepestMastered = 0;

        const pointsMap: Record<string, number> = {};
        for (const [id, data] of Object.entries(nodeMastery)) {
            pointsMap[id] = data.points;
        }

        for (const nm of Object.values(nodeMastery)) {
            const node = CurriculumGraph.getNode(nm.nodeId);
            if (!node) continue;

            const accuracy = nm.attempts > 0 ? nm.successes / nm.attempts : 0;
            const base: GraphNodeProgress = {
                id: node.id,
                name: node.name,
                icon: node.icon,
                bnccCode: node.bnccCode,
                accuracy,
                attempts: nm.attempts
            };

            if (nm.mastered) {
                mastered.push(base);
                if (node.depth > deepestMastered) deepestMastered = node.depth;
            } else if (nm.attempts >= 3 && accuracy <= 0.4) {
                const weakPrereq = CurriculumGraph.findWeakPrerequisite(node.id, pointsMap);
                struggling.push({ ...base, weakPrereqName: weakPrereq?.name });
            } else if (nm.attempts > 0) {
                inProgress.push(base);
            }

            // Equívocos (distratores) capturados neste nó
            if (nm.misconceptions) {
                for (const [wrongAnswer, count] of Object.entries(nm.misconceptions)) {
                    misconceptions.push({ nodeName: node.name, wrongAnswer, count });
                }
            }
        }

        mastered.sort((a, b) => a.name.localeCompare(b.name));
        inProgress.sort((a, b) => b.attempts - a.attempts);
        struggling.sort((a, b) => a.accuracy - b.accuracy);
        misconceptions.sort((a, b) => b.count - a.count);

        return {
            mastered,
            inProgress,
            struggling,
            misconceptions,
            masteredCount: mastered.length,
            deepestMastered
        };
    }

    /**
     * Generates a diagnostic report containing insights on up to 3 key skills.
     */
    public static generateReport(player: Player): DiagnosticInsight[] {
        const insights: DiagnosticInsight[] = [];
        
        // Use the active session stats and overall mastery
        const sessionSkills = player.sessionStats?.skillsPracticed || {};
        const overallMastery = player.skillsMastery || [];
        const nodeMastery = player.nodeMastery || {};

        // 1. Curriculum Graph Insights (New Phase 7 logic)
        // Find nodes the student practiced recently or is struggling with
        const strugglingNodes = Object.values(nodeMastery).filter(nm => 
            !nm.mastered && nm.attempts >= 3 && (nm.successes / nm.attempts) <= 0.4
        );

        if (strugglingNodes.length > 0) {
            strugglingNodes.sort((a, b) => (a.successes / a.attempts) - (b.successes / b.attempts));
            const worstNode = strugglingNodes[0];
            const nodeInfo = CurriculumGraph.getNode(worstNode.nodeId);
            
            if (nodeInfo) {
                // Find if there's a weak prerequisite
                const pointsMap: Record<string, number> = {};
                for (const [id, data] of Object.entries(nodeMastery)) {
                    pointsMap[id] = data.points;
                }
                const weakPrereq = CurriculumGraph.findWeakPrerequisite(nodeInfo.id, pointsMap);

                let message = `O aluno está com dificuldades no conceito "${nodeInfo.name}".`;
                if (weakPrereq) {
                    message += ` Recomendamos revisar o pré-requisito: "${weakPrereq.name}".`;
                } else {
                    message += ` O sistema está ajustando as questões para reforçar esse tópico.`;
                }

                insights.push({
                    skillId: nodeInfo.skillId,
                    skillName: nodeInfo.name, // Use the specific node name
                    status: 'needs_help',
                    trend: 'declining',
                    message
                });
            }
        }

        // 2. Legacy Skill Insights (If no skills practiced this session, return)
        if (Object.keys(sessionSkills).length === 0 && insights.length === 0) {
            return [];
        }

        const skillData = Object.entries(sessionSkills).map(([skillId, stats]) => {
            const mastery = overallMastery.find(m => m.skillId === skillId);
            const accuracy = stats.successes / stats.attempts;
            
            let status: SkillStatus = 'in_progress';
            let trend: DiagnosticInsight['trend'] = 'stable';
            
            if (accuracy >= 0.8) {
                status = 'mastered';
                if (mastery?.level === 'diamond' || mastery?.level === 'gold') trend = 'stable';
                else trend = 'improving';
            } else if (accuracy <= 0.4) {
                status = 'needs_help';
                trend = 'declining';
            } else {
                status = 'in_progress';
                if (mastery?.level === 'bronze') trend = 'improving';
                else trend = 'stable';
            }

            return {
                skillId,
                skillName: this.getFriendlyName(skillId),
                status,
                trend,
                accuracy,
                attempts: stats.attempts
            };
        });

        skillData.sort((a, b) => b.attempts - a.attempts);

        // Fill remaining insights up to 3
        for (const s of skillData) {
            if (insights.length >= 3) break;
            
            // Skip if we already added a specific node insight for this skill
            if (insights.some(i => i.skillId === s.skillId)) continue;

            let message = '';
            if (s.status === 'mastered') {
                message = `Excelente! Você demonstrou forte domínio em ${s.skillName} (${Math.round(s.accuracy * 100)}%).`;
            } else if (s.status === 'needs_help') {
                message = `Atenção: A habilidade ${s.skillName} precisa de reforço. Sugerimos focar nela na próxima partida.`;
            } else {
                if (s.trend === 'improving') {
                    message = `Bom trabalho! Você está evoluindo em ${s.skillName}. Continue praticando!`;
                } else {
                    message = `Você está no caminho certo em ${s.skillName}. A prática leva à perfeição.`;
                }
            }

            insights.push({
                skillId: s.skillId,
                skillName: s.skillName,
                status: s.status,
                trend: s.trend,
                message
            });
        }

        return insights;
    }

    private static getFriendlyName(skillId: string): string {
        const names: Record<string, string> = {
            'math_basic': 'Soma e Subtração',
            'math_logic': 'Raciocínio Lógico',
            'math_expressions': 'Multiplicação e Divisão',
            'math_fractions': 'Frações e Porcentagem',
            'port_grammar': 'Gramática Básica',
            'port_reading': 'Interpretação de Texto',
            'sci_nature': 'Ciências da Natureza e Animais',
            'sci_body': 'Corpo Humano'
        };
        return names[skillId] || skillId;
    }
}
