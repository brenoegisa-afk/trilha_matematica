/**
 * CurriculumEngine — Motor de Progressão Curricular
 * 
 * Gerencia a posição do aluno no grafo de habilidades.
 * Decide QUAL tipo de questão o aluno deve receber baseado em:
 *   1. Quais nós ele já dominou
 *   2. Qual é a "fronteira" dele (próximos nós desbloqueados)
 *   3. Se ele está errando muito, verifica o pré-requisito
 */

import type { Player, NodeMastery, LearningState } from '../types';
import { CurriculumGraph, type CurriculumNode } from './CurriculumGraph';
import { matchesGradeSelection } from './Grade';
import { scheduleReview } from './ReviewSchedule';

export class CurriculumEngine {
    static getLearningState(nodeMastery: NodeMastery | undefined): LearningState {
        if (!nodeMastery || nodeMastery.attempts === 0) return 'discovering';
        if (nodeMastery.reviewDueAt && new Date(nodeMastery.reviewDueAt) <= new Date()) return 'reviewing';
        if (nodeMastery.mastered) return 'mastered';
        const accuracy = nodeMastery.successes / nodeMastery.attempts;
        if (nodeMastery.attempts >= 3 && accuracy >= 0.8) return 'consolidating';
        return 'practicing';
    }
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
            // Pontos são somente uma medida de progresso: não podem liberar
            // pré-requisitos sem as evidências que `updateNodeMastery` exige.
            // placementPassed é a exceção deliberada: ele representa a base
            // comprovada pelo diagnóstico e permite posicionar o aluno sem
            // transformar XP/score em domínio.
            if (node && (data.mastered || data.placementPassed)) {
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
    static pickNode(
        player: Player,
        subjectId: string,
        forcedSkillId?: string,
        grade?: string,
        sessionHistory?: {
            recentNodeIds?: string[];
            recentSkillIds?: string[];
            skillAttempts?: Record<string, number>;
        }
    ): CurriculumNode {
        const mastered = this.getMasteredNodes(player);
        const nodeMastery = this.getNodeMasteryMap(player);

        let frontier = CurriculumGraph.getFrontierNodes(mastered, subjectId);
        const placementDepth = Math.max(0, ...Object.values(nodeMastery)
            .filter(item => item.placementPassed)
            .map(item => CurriculumGraph.getNode(item.nodeId)?.depth || 0));

        // Ciência da SÉRIE: dá preferência a nós da série escolhida, mas a série
        // nunca autoriza pular pré-requisitos. Se ainda não existir um nó elegível
        // nessa série, preservamos a fronteira do grafo em vez de entrar direto em
        // qualquer nó daquela série.
        if (grade) {
            const inGrade = frontier.filter(n =>
                matchesGradeSelection(CurriculumGraph.getNodeGrade(n), grade)
            );
            if (inGrade.length > 0) {
                frontier = inGrade;
            }
        }

        // Se um skillId é forçado (ex: questão customizada do professor com skill específico)
        if (forcedSkillId) {
            const filtered = frontier.filter(n => n.skillId === forcedSkillId);
            if (filtered.length > 0) {
                frontier = filtered;
            }
        }

        // Após o diagnóstico, o aluno já comprovou uma base. Mantemos a prática
        // na fronteira desse patamar (ou acima), sem deixá-lo cair em outro ramo
        // elementar apenas porque a cor da casa pediu "operações básicas".
        if (placementDepth > 0) {
            const atPlacementLevel = frontier.filter(node => node.depth >= placementDepth);
            if (atPlacementLevel.length > 0) frontier = atPlacementLevel;
        }

        // Se a fronteira tem nós, escolhe com inteligência
        if (frontier.length > 0) {
            // Priorizar nós que o aluno já tentou mas ainda não dominou (está "praticando")
            const inProgress = frontier.filter(n => {
                const nm = nodeMastery[n.id];
                return nm && nm.attempts > 0 && !nm.mastered;
            });

            if (inProgress.length > 0) {
                // Um nó mais profundo já iniciado não deve sequestrar toda a
                // sessão quando ainda existem opções no patamar em que o
                // diagnóstico posicionou a criança.
                const sessionDepth = Math.min(...frontier.map(node => node.depth));
                const inProgressAtSessionDepth = inProgress.filter(node => node.depth === sessionDepth);
                const practiceCandidates = inProgressAtSessionDepth.length > 0
                    ? inProgressAtSessionDepth
                    : inProgress;
                // Verifica se está errando muito — pode precisar de revisão do pré-requisito
                const struggling = practiceCandidates.find(n => {
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

                const recentSkills = sessionHistory?.recentSkillIds?.slice(-2) || [];
                if (recentSkills.length === 2 && recentSkills[0] === recentSkills[1]) {
                    const alternativeAxis = frontier.filter(node => node.skillId !== recentSkills[1]);
                    if (alternativeAxis.length > 0) {
                        return this.pickBalancedNode(alternativeAxis, nodeMastery, sessionHistory);
                    }
                }

                // Senão, continua praticando, mas sem repetir o mesmo nó/eixo
                // indefinidamente dentro de uma única partida.
                return this.pickBalancedNode(practiceCandidates, nodeMastery, sessionHistory);
            }

            // Sem prática em andamento, quem veio do diagnóstico começa no
            // ponto mais avançado comprovado; alunos novos continuam pela base.
            // Posicionamento não é autorização para pular direto ao ponto
            // mais profundo que por acaso esteja desbloqueado. Começamos no
            // patamar comprovado (ou no próximo disponível), preservando a
            // progressão e evitando concentrar uma sessão inteira em Frações.
            const targetDepth = Math.min(...frontier.map(node => node.depth));
            return this.pickBalancedNode(
                frontier.filter(node => node.depth === targetDepth),
                nodeMastery,
                sessionHistory
            );
        }

        // Fallback absoluto: retorna o primeiro nó raiz do assunto
        const roots = CurriculumGraph.getRootNodes(subjectId);
        return roots[0] || CurriculumGraph.getAllNodes()[0];
    }

    private static pickBalancedNode(
        nodes: CurriculumNode[],
        nodeMastery: Record<string, NodeMastery>,
        sessionHistory?: {
            recentNodeIds?: string[];
            recentSkillIds?: string[];
            skillAttempts?: Record<string, number>;
        }
    ): CurriculumNode {
        const recentNodes = sessionHistory?.recentNodeIds?.slice(-2) || [];
        const recentSkills = sessionHistory?.recentSkillIds?.slice(-2) || [];
        let candidates = nodes.filter(node => !recentNodes.includes(node.id));
        if (candidates.length === 0) candidates = nodes;

        // Depois de duas questões no mesmo eixo, troca de eixo quando a
        // fronteira oferecer alternativa. Isso controla blocos de frações,
        // operações ou lógica sem impedir uma revisão necessária.
        if (recentSkills.length === 2 && recentSkills[0] === recentSkills[1]) {
            const anotherSkill = candidates.filter(node => node.skillId !== recentSkills[1]);
            if (anotherSkill.length > 0) candidates = anotherSkill;
        }

        // Quando há mais de um eixo possível, a sessão favorece o que recebeu
        // menos tentativas. O histórico recente evita repetições adjacentes;
        // esta contagem evita que um eixo volte a dominar a partida inteira.
        const skillAttempts = sessionHistory?.skillAttempts || {};
        if (new Set(candidates.map(node => node.skillId)).size > 1) {
            const leastAttempts = Math.min(...candidates.map(node => skillAttempts[node.skillId] || 0));
            candidates = candidates.filter(node => (skillAttempts[node.skillId] || 0) === leastAttempts);
        }

        const fewestAttempts = Math.min(...candidates.map(node => nodeMastery[node.id]?.attempts || 0));
        const leastPracticed = candidates.filter(node => (nodeMastery[node.id]?.attempts || 0) === fewestAttempts);
        return leastPracticed[Math.floor(Math.random() * leastPracticed.length)];
    }

    /**
     * Atualiza a maestria do aluno em um nó após responder uma questão.
     * Retorna o nodeMastery atualizado e se houve promoção (nó dominado).
     */
    // Anti-chute: um acerto suspeito de rápido demais (tap na sorte / sem ler)
    // vale menos pontos de maestria — assim não dá para "dominar" tapeando rápido.
    private static readonly POINTS_CORRECT = 60;
    private static readonly POINTS_CORRECT_LOW_CONFIDENCE = 20;
    private static readonly POINTS_WRONG = 25;
    // Nunca considerar dominado com pouquíssima evidência, mesmo se o threshold for baixo.
    private static readonly MIN_ATTEMPTS_TO_MASTER = 6;

    static updateNodeMastery(
        player: Player,
        nodeId: string,
        isCorrect: boolean,
        selectedOption?: string,
        lowConfidence: boolean = false,
        supportLevel: 'none' | 'hint' | 'visual' | 'worked_example' = 'none'
    ): { nodeMastery: Record<string, NodeMastery>; promoted: boolean; masteredNode?: CurriculumNode; newNode?: CurriculumNode } {
        const nodeMasteryMap = { ...this.getNodeMasteryMap(player) };
        const node = CurriculumGraph.getNode(nodeId);

        if (!nodeMasteryMap[nodeId]) {
            nodeMasteryMap[nodeId] = { nodeId, points: 0, attempts: 0, successes: 0, mastered: false };
        }

        const nm = nodeMasteryMap[nodeId];
        // Compatibilidade: em perfis anteriores a esta regra, as tentativas
        // já registradas são consideradas independentes. A partir de agora,
        // pistas e exemplos são guardados sem virar evidência de domínio.
        const independentAttemptsBefore = nm.independentAttempts ?? nm.attempts;
        const independentSuccessesBefore = nm.independentSuccesses ?? nm.successes;
        const isIndependent = supportLevel === 'none';
        const wasDueForReview = !!nm.reviewDueAt && new Date(nm.reviewDueAt) <= new Date();
        nm.attempts += 1;

        if (isIndependent) {
            nm.independentAttempts = independentAttemptsBefore + 1;
            if (isCorrect) nm.independentSuccesses = independentSuccessesBefore + 1;
            else nm.independentSuccesses = independentSuccessesBefore;
        } else {
            nm.independentAttempts = independentAttemptsBefore;
            nm.independentSuccesses = independentSuccessesBefore;
        }

        if (isCorrect) {
            nm.successes += 1;
            const gain = lowConfidence ? this.POINTS_CORRECT_LOW_CONFIDENCE : this.POINTS_CORRECT;
            nm.points = Math.min(1000, nm.points + gain);
        } else {
            nm.points = Math.max(0, nm.points - this.POINTS_WRONG);
            // Registra o distrator escolhido (sinal diagnóstico para o professor).
            if (selectedOption) {
                if (!nm.misconceptions) nm.misconceptions = {};
                nm.misconceptions[selectedOption] = (nm.misconceptions[selectedOption] || 0) + 1;
            }
        }
        if (wasDueForReview && isCorrect && isIndependent) nm.successfulReviews = (nm.successfulReviews || 0) + 1;

        const review = scheduleReview(new Date(),
            nm.reviewDueAt ? { intervalIndex: nm.reviewIntervalIndex ?? 0, reviewDueAt: nm.reviewDueAt } : undefined,
            isCorrect,
            supportLevel
        );
        nm.reviewDueAt = review.reviewDueAt;
        nm.reviewIntervalIndex = review.intervalIndex;

        // Verificar promoção
        let promoted = false;
        let masteredNode: CurriculumNode | undefined;
        let newNode: CurriculumNode | undefined;

        const independentAttempts = nm.independentAttempts || 0;
        const independentSuccesses = nm.independentSuccesses || 0;
        const accuracy = independentAttempts > 0 ? independentSuccesses / independentAttempts : 0;
        if (node && nm.points >= node.masteryThreshold && independentAttempts >= this.MIN_ATTEMPTS_TO_MASTER && accuracy >= 0.8 && (nm.successfulReviews || 0) >= 1 && !nm.mastered) {
            nm.mastered = true;
            promoted = true;
            masteredNode = node;

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

        return { nodeMastery: nodeMasteryMap, promoted, masteredNode, newNode };
    }
}
