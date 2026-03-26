import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { ParentService } from '../core/services/ParentService';
import type { Player, DiagnosticInsight } from '../core/types';
import styles from './ParentDashboard.module.css';

export default function ParentDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [children, setChildren] = useState<Player[]>([]);
    const [reports, setReports] = useState<Record<string, DiagnosticInsight[]>>({});

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                return;
            }

            const kids = await ParentService.getChildrenProfiles(user.id);
            setChildren(kids);
            const insights = ParentService.generateChildrenReports(kids);
            setReports(insights);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingSpinner}>Carregando Relatórios...</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerTitle}>
                    <h1>Painel da Família 👨‍👩‍👧</h1>
                    <p>Acompanhe o desenvolvimento do seu filho</p>
                </div>
                <button className={styles.backBtn} onClick={() => navigate('/')}>Voltar ao Início</button>
            </header>

            <main className={styles.main}>
                {children.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>🧩</div>
                        <h2>Nenhum aventureiro vinculado!</h2>
                        <p>Para adicionar o seu filho, clique em "Vincular Filho" e passe o código da conta dele.</p>
                        <button className={styles.primaryBtn}>Vincular Criança</button>
                    </div>
                ) : (
                    <div className={styles.childrenGrid}>
                        {children.map(child => (
                            <ChildCard 
                                key={child.id} 
                                child={child} 
                                insights={reports[child.id] || []} 
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

function ChildCard({ child, insights }: { child: Player, insights: DiagnosticInsight[] }) {
    const { totalQuestions, correctAnswers, skillsPracticed } = child.sessionStats;
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    
    // Formatting Skill Names map (could be centralized)
    const SKILL_NAMES: Record<string, string> = {
        'math_basic': 'Op. Básicas',
        'math_expressions': 'Expressões',
        'math_logic': 'Raciocínio Lógico',
        'port_grammar': 'Gramática',
        'sci_nature': 'Ciências'
    };

    return (
        <div className={styles.childCard} style={{ borderColor: child.color }}>
            <div className={styles.cardHeader} style={{ backgroundColor: child.color }}>
                <span className={styles.avatar}>{child.avatar}</span>
                <div className={styles.headerInfo}>
                    <h2>{child.name}</h2>
                    <span className={styles.levelBadge}>Nível {child.level}</span>
                </div>
            </div>

            <div className={styles.statsContainer}>
                <div className={styles.statBox}>
                    <span className={styles.statValue}>{accuracy}%</span>
                    <span className={styles.statLabel}>Precisão</span>
                </div>
                <div className={styles.statBox}>
                    <span className={styles.statValue}>{totalQuestions}</span>
                    <span className={styles.statLabel}>Desafios</span>
                </div>
            </div>

            <div className={styles.skillsContainer}>
                <h3>Progresso nas Habilidades</h3>
                {!skillsPracticed || Object.keys(skillsPracticed).length === 0 ? (
                    <p className={styles.emptyText}>Ainda não completou aventuras com relatórios.</p>
                ) : (
                    <div className={styles.skillList}>
                        {Object.entries(skillsPracticed).map(([skillId, stats]) => {
                            const percent = Math.round((stats.successes / stats.attempts) * 100);
                            return (
                                <div key={skillId} className={styles.skillItem}>
                                    <div className={styles.skillLabels}>
                                        <span className={styles.skillName}>{SKILL_NAMES[skillId] || skillId.replace(/_/g, ' ')}</span>
                                        <span className={styles.skillPercent}>{percent}%</span>
                                    </div>
                                    <div className={styles.barBg}>
                                        <div 
                                            className={styles.barFill} 
                                            style={{ width: `${percent}%`, backgroundColor: child.color }} 
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {insights.length > 0 && (
                <div className={styles.insightsContainer}>
                    <h3>Diagnóstico Inteligente</h3>
                    {insights.map((insight, idx) => (
                        <div key={idx} className={`${styles.insightItem} ${styles[insight.status]}`}>
                            <div className={styles.insightIcon}>
                                {insight.status === 'mastered' ? '🌟' : insight.status === 'needs_help' ? '⚠️' : '📈'}
                            </div>
                            <div className={styles.insightContent}>
                                <strong>{insight.skillName}</strong>
                                <p>{insight.message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <button className={styles.premiumOverlayBtn}>
                Bloquear Modo Tarefa (Premium) 🔒
            </button>
        </div>
    );
}
