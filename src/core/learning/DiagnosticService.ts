import type { Player, DiagnosticInsight, SkillStatus } from '../types';

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

        // If no skills practiced this session, return empty or fallback
        if (Object.keys(sessionSkills).length === 0) {
            return [];
        }

        const skillData = Object.entries(sessionSkills).map(([skillId, stats]) => {
            const mastery = overallMastery.find(m => m.skillId === skillId);
            const accuracy = stats.successes / stats.attempts;
            
            // Basic trend estimation (just based on session for now)
            // In a real database, we'd compare against previous explicit sessions
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

        // Sort by attempts to prioritize the most practiced skills
        skillData.sort((a, b) => b.attempts - a.attempts);

        // Take top 3 for the report
        const topSkills = skillData.slice(0, 3);

        topSkills.forEach(s => {
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
        });

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
