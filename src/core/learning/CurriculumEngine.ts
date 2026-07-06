/**
 * CurriculumEngine — Motor de Progressão Curricular
 * 
 * Gerencia a posição do aluno no grafo de habilidades.
 * Decide QUAL tipo de questão o aluno deve receber baseado em:
 *   1. Quais nós ele já dominou
 *   2. Qual é a "fronteira" dele (próximos nós desbloqueados)
 *   3. Se ele está errando muito, verifica o pré-requisito
 */

import type { Player, SkillMastery, NodeMastery } from '../types';
import { CurriculumGraph, type CurriculumNode } from './CurriculumGraph';

export class CurriculumEngine {
    /**
     * Extrai os pontos de maestria por nó a partir do player.
     * Usa o campo nodeMastery do sessionStats ou inicializa vazio.
     */
    static getNodeMasteryMap(player: Player): Record<string, NodeMastery> {
        return (player as any).nodeMastery || {};
    }

    /**
     * Retorna o Set de nós dominados pelo aluno.
     */
    static getMasteredNodes(player: Player): Set<string> {
        const nodeMastery = this.getNodeMasteryMap(player);
        const mastered = new Set<string>();

        for (const [nodeId, data] of Object.entries(nodeMastery)) {
            const node = CurriculumGraph.getNode(nodeId);
            if (node && data.points >= node.masteryThreshold) {
                mastered.add(nodeId);
            }
        }

        return mastered;
    }

    /**
     * Escolhe o nó curricular mais adequado para o aluno praticar agora.
     * 
     * Lógica:
     * 1. Calcula quais nós o aluno já dominou
     * 2. Pega a fronteira (nós desbloqueados que ele ainda não dominou)
     * 3. Se um skillId é forçado, filtra a fronteira por aquele skill
     * 4. Prioriza nós com mais tentativas sem maestria (onde ele está "travado")
     * 5. Se não há fronteira, retorna nós raiz
     */
    static pickNode(player: Player, subjectId: string, forcedSkillId?: string): CurriculumNode {
        const mastered = this.getMasteredNodes(player);
        const nodeMastery = this.getNodeMasteryMap(player);

        let frontier = CurriculumGraph.getFrontierNodes(mastered, subjectId);

        // Se um skillId é forçado (ex: questão customizada do professor com skill específico)
        if (forcedSkillId) {
            const filtered = frontier.filter(n => n.skillId === forcedSkillId);
            if (filtered.length > 0) {
                frontier = filtered;
            }
        }

        // Se a fronteira tem nós, escolhe com inteligência
        if (frontier.length > 0) {
            // Priorizar nós que o aluno já tentou mas ainda não dominou (está "praticando")
            const inProgress = frontier.filter(n => {
                const nm = nodeMastery[n.id];
                return nm && nm.attempts > 0 && !nm.mastered;
            });

            if (inProgress.length > 0) {
                // Verifica se está errando muito — pode precisar de revisão do pré-requisito
                const struggling = inProgress.find(n => {
                    const nm = nodeMastery[n.id];
                    return nm && nm.attempts >= 5 && (nm.successes / nm.attempts) < 0.4;
                });

                if (struggling) {
                    // Olha um nível abaixo no grafo
                    const pointsMap: Record<string, number> = {};
                    for (const [id, data] of Object.entries(nodeMastery)) {
                        pointsMap[id] = data.points;
                    }
                    const weakPrereq = CurriculumGraph.findWeakPrerequisite(struggling.id, pointsMap);
                    if (weakPrereq) {
                        return weakPrereq; // Volta para reforçar o pré-requisito!
                    }
                }

                // Senão, continua praticando o nó em progresso (aleatório entre eles)
                return inProgress[Math.floor(Math.random() * inProgress.length)];
            }

            // Nenhum em progresso — pega um nó novo da fronteira (menor depth primeiro)
            frontier.sort((a, b) => a.depth - b.depth);
            return frontier[0];
        }

        // Fallback absoluto: retorna o primeiro nó raiz do assunto
        const roots = CurriculumGraph.getRootNodes(subjectId);
        return roots[0] || CurriculumGraph.getAllNodes()[0];
    }

    /**
     * Atualiza a maestria do aluno em um nó após responder uma questão.
     * Retorna o nodeMastery atualizado e se houve promoção (nó dominado).
     */
    static updateNodeMastery(
        player: Player,
        nodeId: string,
        isCorrect: boolean
    ): { nodeMastery: Record<string, NodeMastery>; promoted: boolean; newNode?: CurriculumNode } {
        const nodeMasteryMap = { ...this.getNodeMasteryMap(player) };
        const node = CurriculumGraph.getNode(nodeId);

        if (!nodeMasteryMap[nodeId]) {
            nodeMasteryMap[nodeId] = { nodeId, points: 0, attempts: 0, successes: 0, mastered: false };
        }

        const nm = nodeMasteryMap[nodeId];
        nm.attempts += 1;

        if (isCorrect) {
            nm.successes += 1;
            nm.points = Math.min(1000, nm.points + 60);
        } else {
            nm.points = Math.max(0, nm.points - 25);
        }

        // Verificar promoção
        let promoted = false;
        let newNode: CurriculumNode | undefined;

        if (node && nm.points >= node.masteryThreshold && !nm.mastered) {
            nm.mastered = true;
            promoted = true;

            // Descobrir qual nó foi desbloqueado
            const newMastered = new Set<string>();
            for (const [id, data] of Object.entries(nodeMasteryMap)) {
                if (data.mastered) newMastered.add(id);
            }
            const unlocked = CurriculumGraph.getUnlockedNodes(newMastered, node.subjectId);
            if (unlocked.length > 0) {
                newNode = unlocked[0];
            }
        }

        return { nodeMastery: nodeMasteryMap, promoted, newNode };
    }
}
