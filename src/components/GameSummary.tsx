import { useGame } from '../context/GameContext';
import styles from './GameSummary.module.css';
import type { Player } from '../core/types';
import { DiagnosticService } from '../core/learning/DiagnosticService';

export default function GameSummary() {
    const { gameState, players } = useGame();

    if (gameState.status !== 'finished') return null;

    // In multiplayer, we might want to show everyone, but for now let's show a list of summaries
    return (
        <div className={styles.overlay}>
            <div className={styles.container}>
                <h1 className={styles.mainTitle}>🏆 Relatório de Aventura</h1>
                
                <div className={styles.playerList}>
                    {players.map(player => (
                        <PlayerStatsCard key={player.id} player={player} />
                    ))}
                </div>

                <div className={styles.footer}>
                    <button 
                        className={styles.finishButton}
                        onClick={() => window.location.href = '/'}
                    >
                        Voltar ao Menu Inicial
                    </button>
                </div>
            </div>
        </div>
    );
}

const SKILL_NAMES: Record<string, string> = {
    'math_basic': 'Operações Básicas',
    'math_expressions': 'Expressões Numéricas',
    'math_logic': 'Raciocínio Lógico',
    'port_grammar': 'Gramática e Escrita',
    'sci_nature': 'Ciências e Natureza'
};

function PlayerStatsCard({ player }: { player: Player }) {
    const { totalQuestions, correctAnswers, skillsPracticed } = player.sessionStats;
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const insights = DiagnosticService.generateReport(player);

    return (
        <div className={styles.playerCard} style={{ borderColor: player.color }}>
            <div className={styles.playerHeader}>
                <div className={styles.avatar} style={{ backgroundColor: player.color }}>
                    {player.avatar || '👤'}
                </div>
                <div className={styles.nameArea}>
                    <h2 className={styles.playerName}>{player.name}</h2>
                    <span className={styles.levelBadge}>Nível {player.level}</span>
                </div>
            </div>

            <div className={styles.statsOverview}>
                <div className={styles.statBox}>
                    <span className={styles.statValue}>{accuracy}%</span>
                    <span className={styles.statLabel}>Precisão</span>
                </div>
                <div className={styles.statBox}>
                    <span className={styles.statValue}>{correctAnswers}/{totalQuestions}</span>
                    <span className={styles.statLabel}>Acertos</span>
                </div>
                <div className={styles.statBox}>
                    <span className={styles.statValue}>+{player.score}</span>
                    <span className={styles.statLabel}>XP Ganhos</span>
                </div>
            </div>

            <div className={styles.skillsSection}>
                <h3 className={styles.sectionTitle}>Habilidades Praticadas:</h3>
                {Object.keys(skillsPracticed).length > 0 ? (
                    <div className={styles.skillList}>
                        {Object.entries(skillsPracticed).map(([skillId, stats]) => (
                            <div key={skillId} className={styles.skillItem}>
                                <div className={styles.skillInfo}>
                                    <span className={styles.skillName}>
                                        {SKILL_NAMES[skillId] || skillId.replace(/_/g, ' ')}
                                    </span>
                                    <span className={styles.skillPercent}>
                                        {Math.round((stats.successes / stats.attempts) * 100)}%
                                    </span>
                                </div>
                                <div className={styles.progressBarBg}>
                                    <div 
                                        className={styles.progressBarFill} 
                                        style={{ 
                                            width: `${(stats.successes / stats.attempts) * 100}%`,
                                            backgroundColor: player.color 
                                        }} 
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className={styles.emptyText}>Nenhuma habilidade registrada nesta partida.</p>
                )}
            </div>

            {insights.length > 0 && (
                <div className={styles.insightsSection}>
                    <h3 className={styles.sectionTitle}>Diagnóstico Inteligente:</h3>
                    <div className={styles.insightsList}>
                        {insights.map((insight, idx) => (
                            <div key={idx} className={`${styles.insightItem} ${styles[insight.status]}`}>
                                <div className={styles.insightHeader}>
                                    <span className={styles.insightIcon}>
                                        {insight.status === 'mastered' ? '🌟' : insight.status === 'needs_help' ? '⚠️' : '📈'}
                                    </span>
                                    <span className={styles.insightSkill}>{insight.skillName}</span>
                                </div>
                                <p className={styles.insightMessage}>{insight.message}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {player.achievements.length > 0 && (
                <div className={styles.achievementsSection}>
                    <h3 className={styles.sectionTitle}>Conquistas:</h3>
                    <div className={styles.achievementIcons}>
                        {player.achievements.slice(-4).map(ach => (
                            <div key={ach.id} className={styles.achievementBadge} title={ach.name}>
                                {ach.icon}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
