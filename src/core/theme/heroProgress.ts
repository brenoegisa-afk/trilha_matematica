import type { Player } from '../types';
import { CurriculumGraph } from '../learning/CurriculumGraph';

/**
 * Estágio visual do herói (1 a 5) a partir do progresso da criança.
 *
 * Regra: é a MAIOR profundidade de nó já dominada no grafo curricular.
 * Assim a armadura/roupa cresce conforme a criança avança na matéria —
 * é a ponte entre o motor de aprendizagem e a camada de identidade (HeroesMap).
 */
export function getPlayerHeroStage(player: Player): number {
    const mastery = player.nodeMastery || {};
    let maxDepth = 0;

    for (const key of Object.keys(mastery)) {
        const m = mastery[key];
        if (!m?.mastered) continue;
        const node = CurriculumGraph.getNode(m.nodeId || key);
        if (node && node.depth > maxDepth) maxDepth = node.depth;
    }

    return Math.max(1, Math.min(maxDepth || 1, 5));
}
