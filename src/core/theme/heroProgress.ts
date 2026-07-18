import type { Player } from '../types';
import { CurriculumGraph } from '../learning/CurriculumGraph';

/**
 * Estágio visual do herói (1 a 5) a partir do progresso da criança.
 *
 * Regra: fração de nós de matemática já dominados no grafo curricular
 * (não a maior profundidade de um único nó — um só nó difícil dominado
 * não deve virar "Rei" de uma vez; a armadura cresce com o VOLUME de
 * trilha percorrida). É a ponte entre o motor de aprendizagem e a
 * camada de identidade (HeroesMap).
 */
export function getPlayerHeroStage(player: Player): number {
    const mastery = player.nodeMastery || {};
    const totalMathNodes = CurriculumGraph.getNodesBySubject('math').length;
    if (totalMathNodes === 0) return 1;

    let masteredCount = 0;
    for (const key of Object.keys(mastery)) {
        const m = mastery[key];
        if (!m?.mastered) continue;
        const node = CurriculumGraph.getNode(m.nodeId || key);
        if (node?.subjectId === 'math') masteredCount++;
    }

    const ratio = masteredCount / totalMathNodes;
    const stage = 1 + Math.floor(Math.min(ratio, 1) * 4);
    return Math.max(1, Math.min(stage, 5));
}
