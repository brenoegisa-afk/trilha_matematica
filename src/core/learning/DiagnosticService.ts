import type { Player, DiagnosticInsight, SkillStatus } from '../types';
import { CurriculumGraph } from './CurriculumGraph';

/**
 * DiagnosticService
 * Analyzes player's skill mastery to generate actionable insights and reports.
 */
export class DiagnosticService {
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
