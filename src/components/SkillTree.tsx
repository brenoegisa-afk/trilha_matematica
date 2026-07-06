import React from 'react';
import type { Player } from '../core/types';
import { CurriculumGraph } from '../core/learning/CurriculumGraph';
import { CurriculumEngine } from '../core/learning/CurriculumEngine';
import styles from './SkillTree.module.css';

interface Props {
    player: Player;
}

export const SkillTree: React.FC<Props> = ({ player }) => {
    // Only mapping Math for now
    const subjectId = 'math';
    const allNodes = CurriculumGraph.getNodesBySubject(subjectId);
    
    // Group nodes by depth
    const nodesByDepth = allNodes.reduce((acc, node) => {
        if (!acc[node.depth]) acc[node.depth] = [];
        acc[node.depth].push(node);
        return acc;
    }, {} as Record<number, typeof allNodes>);

    const masteredNodes = CurriculumEngine.getMasteredNodes(player);
    const frontierNodes = CurriculumGraph.getFrontierNodes(masteredNodes, subjectId);

    const getStatus = (nodeId: string) => {
        if (masteredNodes.has(nodeId)) return 'mastered';
        if (frontierNodes.find(n => n.id === nodeId)) return 'unlocked';
        return 'locked';
    };

    return (
        <div className={styles.container}>
            <h2>🧠 Trilha do Conhecimento (Matemática)</h2>
            <p>Seu progresso na jornada do aprendizado! Desbloqueie novos conceitos vencendo batalhas.</p>

            <div className={styles.tree}>
                {Object.keys(nodesByDepth)
                    .map(Number)
                    .sort((a, b) => b - a) // Show highest depth on top
                    .map(depth => (
                        <div key={depth} className={styles.depthRow}>
                            <div className={styles.depthLabel}>Nível {depth}</div>
                            <div className={styles.nodesContainer}>
                                {nodesByDepth[depth].map(node => {
                                    const status = getStatus(node.id);
                                    
                                    return (
                                        <div 
                                            key={node.id} 
                                            className={`${styles.node} ${styles[status]}`}
                                            title={node.description}
                                        >
                                            <div className={styles.nodeIcon}>{node.icon}</div>
                                            <div className={styles.nodeName}>{node.name}</div>
                                            {status === 'mastered' && <div className={styles.check}>✅</div>}
                                            {status === 'locked' && <div className={styles.lock}>🔒</div>}
                                            {status === 'unlocked' && <div className={styles.activeLabel}>Próximo</div>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
};
