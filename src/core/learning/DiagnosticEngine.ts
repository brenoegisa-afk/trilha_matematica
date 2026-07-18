import { CurriculumGraph, type CurriculumNode } from './CurriculumGraph';
import type { NodeMastery } from '../types';
import { normalizeGrade, type Grade } from './Grade';

export const DIAGNOSTIC_MIN_CHALLENGES = 8;
export const DIAGNOSTIC_MAX_CHALLENGES = 12;
export const DIAGNOSTIC_VERSION = 'v2';

export interface DiagnosticEvidence {
    nodeId: string;
    skillId: string;
    isCorrect: boolean;
    supportLevel: 'none' | 'hint' | 'visual' | 'worked_example';
}

/** Núcleo puro do diagnóstico: não atribui nota nem altera maestria. */
export class DiagnosticEngine {
    /**
     * Converte evidências do diagnóstico em posicionamento conservador.
     * Um acerto independente num nó só libera seus pré-requisitos: o próprio
     * nó continua para prática e precisa de evidências reais para ser dominado.
     */
    static applyPlacement(
        currentMastery: Record<string, NodeMastery>,
        evidence: DiagnosticEvidence[],
        diagnosedAt = new Date().toISOString()
    ): Record<string, NodeMastery> {
        const next = { ...currentMastery };
        // Marcador serializado junto à maestria. Não é nó do grafo e nunca
        // libera conteúdo; impede apenas um novo diagnóstico após conclusão.
        next.__diagnostic_math_v2 = {
            nodeId: '__diagnostic_math_v2', points: 0, attempts: 0,
            successes: 0, mastered: false, diagnosticVersion: DIAGNOSTIC_VERSION,
            placementDiagnosedAt: diagnosedAt
        };
        const highestCorrectBySkill = new Map<string, CurriculumNode>();

        for (const item of evidence) {
            if (!item.isCorrect || item.supportLevel !== 'none') continue;
            const node = CurriculumGraph.getNode(item.nodeId);
            const current = node && highestCorrectBySkill.get(item.skillId);
            if (node && (!current || node.depth > current.depth)) {
                highestCorrectBySkill.set(item.skillId, node);
            }
        }

        const addPrerequisites = (nodeId: string) => {
            const node = CurriculumGraph.getNode(nodeId);
            if (!node) return;
            for (const prerequisiteId of node.prerequisites) {
                const existing = next[prerequisiteId];
                next[prerequisiteId] = {
                    nodeId: prerequisiteId,
                    points: existing?.points || 0,
                    attempts: existing?.attempts || 0,
                    successes: existing?.successes || 0,
                    mastered: existing?.mastered || false,
                    misconceptions: existing?.misconceptions,
                    reviewDueAt: existing?.reviewDueAt,
                    reviewIntervalIndex: existing?.reviewIntervalIndex,
                    successfulReviews: existing?.successfulReviews,
                    placementPassed: true,
                    placementDiagnosedAt: diagnosedAt
                };
                addPrerequisites(prerequisiteId);
            }
        };

        highestCorrectBySkill.forEach(node => addPrerequisites(node.id));
        return next;
    }

    static getStartingNodes(subjectId: string, selectedGrade: string): CurriculumNode[] {
        const targetDepth = Math.max(1, Number(normalizeGrade(selectedGrade)) - 1);
        const bySkill = new Map<string, CurriculumNode[]>();

        CurriculumGraph.getNodesBySubject(subjectId).forEach(node => {
            bySkill.set(node.skillId, [...(bySkill.get(node.skillId) || []), node]);
        });

        return Array.from(bySkill.values()).flatMap(nodes => {
            const eligible = nodes.filter(node => node.depth <= targetDepth);
            const starting = (eligible.length ? eligible : nodes)
                .sort((a, b) => b.depth - a.depth)[0];
            return starting ? [starting] : [];
        });
    }

    static getNextNode(
        subjectId: string,
        selectedGrade: Grade,
        evidence: DiagnosticEvidence[]
    ): CurriculumNode | null {
        const starts = this.getStartingNodes(subjectId, selectedGrade);
        const untested = starts.find(node => !evidence.some(item => item.skillId === node.skillId));
        if (untested) return untested;

        if (evidence.length >= DIAGNOSTIC_MAX_CHALLENGES) return null;

        // A segunda volta precisa circular pelos eixos, e não continuar no
        // último deles. Antes esta escolha usava sempre a última evidência:
        // como Frações costuma ser o último eixo do grafo, o diagnóstico
        // acabava exibindo várias frações consecutivas.
        const evidenceBySkill = new Map<string, DiagnosticEvidence[]>();
        for (const item of evidence) {
            evidenceBySkill.set(item.skillId, [...(evidenceBySkill.get(item.skillId) || []), item]);
        }
        const targetEvidencePerSkill = 2;
        const nextSkill = starts
            .map(node => node.skillId)
            .find(skillId => (evidenceBySkill.get(skillId)?.length || 0) < targetEvidencePerSkill);

        // O diagnóstico mínimo termina somente quando cada eixo teve duas
        // evidências. Isso entrega 8 microdesafios equilibrados em Matemática.
        if (!nextSkill) return null;

        const skillEvidence = evidenceBySkill.get(nextSkill) || [];
        const last = skillEvidence[skillEvidence.length - 1];
        const candidates = CurriculumGraph.getNodesBySubject(subjectId)
            .filter(node => node.skillId === nextSkill)
            .sort((a, b) => a.depth - b.depth);
        const current = CurriculumGraph.getNode(last.nodeId);
        if (!current) return null;

        const currentIndex = candidates.findIndex(node => node.id === current.id);
        const nextIndex = last.isCorrect && last.supportLevel === 'none'
            ? currentIndex + 1
            : currentIndex - 1;
        const next = candidates[nextIndex];

        // Ao chegar ao limite inferior/superior, segue para outra evidência do
        // mesmo eixo até atingir o mínimo, sem apresentar nota à criança.
        if (next && next.depth <= Number(selectedGrade)) return next;
        return evidence.length < DIAGNOSTIC_MIN_CHALLENGES ? current : null;
    }
}
