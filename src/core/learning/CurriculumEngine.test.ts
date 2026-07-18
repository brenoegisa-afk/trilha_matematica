import { describe, it, expect } from 'vitest';
import { CurriculumEngine } from './CurriculumEngine';
import { CurriculumGraph } from './CurriculumGraph';
import type { Player, NodeMastery } from '../types';

function makePlayer(nodeMastery: Record<string, NodeMastery> = {}): Player {
    return {
        id: 'p1',
        name: 'Teste',
        color: 'red',
        avatar: '🙂',
        currentPosition: 0,
        inventoryProtectionCount: 0,
        score: 0,
        streak: 1,
        level: 1,
        xp: 0,
        achievements: [],
        hp: 100,
        maxHp: 100,
        mascots: [],
        skillsMastery: [],
        srsReviews: [],
        sessionStats: { totalQuestions: 0, correctAnswers: 0, skillsPracticed: {} },
        nodeMastery
    };
}

// Domina um nó "de mentira": preenche pontos/tentativas suficientes para bater o threshold.
function mastered(nodeId: string): NodeMastery {
    const node = CurriculumGraph.getNode(nodeId)!;
    return { nodeId, points: node.masteryThreshold, attempts: 5, successes: 5, mastered: true };
}

describe('CurriculumEngine.pickNode', () => {
    it('aluno novo (sem nada dominado, sem série) começa num nó raiz', () => {
        const player = makePlayer();
        const node = CurriculumEngine.pickNode(player, 'math');
        expect(node.prerequisites).toEqual([]);
    });

    it('respeita pré-requisitos: só oferece um nó cujo pré-requisito já foi dominado', () => {
        const player = makePlayer({ add_simple: mastered('add_simple') });
        const node = CurriculumEngine.pickNode(player, 'math');
        // Com add_simple dominado, a fronteira passa a ser add_two_digits, mult_intro,
        // seq_simple (todos com prereq satisfeito) + sub_simple (raiz, sempre disponível).
        expect(['add_two_digits', 'mult_intro', 'sub_simple', 'seq_simple']).toContain(node.id);
    });

    it('prioriza nó "em progresso" (tentado, não dominado) sobre nó novo', () => {
        const player = makePlayer({
            add_simple: { nodeId: 'add_simple', points: 100, attempts: 2, successes: 2, mastered: false }
        });
        const node = CurriculumEngine.pickNode(player, 'math');
        expect(node.id).toBe('add_simple');
    });

    it('quando travado (≥5 tentativas, <40% acerto), recua para o pré-requisito fraco', () => {
        const player = makePlayer({
            add_simple: mastered('add_simple'),
            add_two_digits: { nodeId: 'add_two_digits', points: 50, attempts: 6, successes: 1, mastered: false }
        });
        const node = CurriculumEngine.pickNode(player, 'math');
        // add_two_digits está travado; seu único pré-requisito (add_simple) já está
        // dominado, então findWeakPrerequisite não acha nada fraco e mantém o nó atual.
        expect(node.id).toBe('add_two_digits');
    });

    it('não seleciona um nó legado em progresso quando ele tem pré-requisito pendente', () => {
        // Um perfil pode ter recebido seq_mult antes da correção do fallback por série.
        // O motor deve voltar a uma fronteira elegível, e não continuar o nó inválido.
        const player = makePlayer({
            seq_pattern: mastered('seq_pattern'),
            seq_mult: { nodeId: 'seq_mult', points: 50, attempts: 6, successes: 1, mastered: false }
        });
        const node = CurriculumEngine.pickNode(player, 'math', undefined, '3-4');
        expect(node.id).not.toBe('seq_mult');
        expect(node.prerequisites.every(prerequisite =>
            CurriculumEngine.getMasteredNodes(player).has(prerequisite)
        )).toBe(true);
    });

    it('forcedSkillId filtra a fronteira quando há opções compatíveis', () => {
        const player = makePlayer({ add_simple: mastered('add_simple') });
        const node = CurriculumEngine.pickNode(player, 'math', 'math_expressions');
        expect(node.skillId).toBe('math_expressions');
        expect(node.id).toBe('mult_intro');
    });

    it('forcedSkillId é ignorado quando nenhum nó da fronteira bate com ele', () => {
        const player = makePlayer();
        // Fronteira raiz não tem nenhum nó math_expressions ainda (mult_intro exige add_simple).
        const node = CurriculumEngine.pickNode(player, 'math', 'math_expressions');
        expect(node.skillId).not.toBe('math_expressions');
    });

    it('não pula pré-requisitos quando a série não possui nó na fronteira', () => {
        // Aluno começando do zero com a série "5": nenhum nó do 5º ano está
        // desbloqueado. A seleção deve manter a fronteira curricular elegível.
        const player = makePlayer();
        const node = CurriculumEngine.pickNode(player, 'math', undefined, '5');
        expect(node.grade).not.toBe('5');
        expect(node.prerequisites).toEqual([]);
    });

    it('prioriza a série escolhida quando ela já possui nó elegível', () => {
        const player = makePlayer({ mult_intro: mastered('mult_intro') });
        const node = CurriculumEngine.pickNode(player, 'math', undefined, '3-4');
        expect(node.grade).toBe('3-4');
    });

    it('após posicionamento diagnóstico, não retorna a um ramo elementar em progresso', () => {
        const placement = (nodeId: string): NodeMastery => ({
            nodeId, points: 0, attempts: 0, successes: 0, mastered: false, placementPassed: true
        });
        const player = makePlayer({
            add_simple: placement('add_simple'),
            add_two_digits: placement('add_two_digits'),
            add_regroup: placement('add_regroup'),
            sub_simple: { nodeId: 'sub_simple', points: 120, attempts: 2, successes: 2, mastered: false }
        });
        const node = CurriculumEngine.pickNode(player, 'math', 'math_basic', '5');
        expect(node.id).toBe('add_three_digit');
    });
});

describe('CurriculumEngine.getLearningState', () => {
    it('deriva os estados pedagógicos sem migrar perfis existentes', () => {
        expect(CurriculumEngine.getLearningState(undefined)).toBe('discovering');
        expect(CurriculumEngine.getLearningState({ nodeId: 'add_simple', points: 60, attempts: 1, successes: 1, mastered: false })).toBe('practicing');
        expect(CurriculumEngine.getLearningState({ nodeId: 'add_simple', points: 180, attempts: 3, successes: 3, mastered: false })).toBe('consolidating');
        expect(CurriculumEngine.getLearningState({ nodeId: 'add_simple', points: 250, attempts: 5, successes: 5, mastered: true })).toBe('mastered');
    });

    it('prioriza revisão quando a data já venceu', () => {
        expect(CurriculumEngine.getLearningState({ nodeId: 'add_simple', points: 250, attempts: 5, successes: 5, mastered: true, reviewDueAt: '2020-01-01T00:00:00.000Z' })).toBe('reviewing');
    });
});

describe('CurriculumEngine.updateNodeMastery', () => {
    it('acerto soma pontos e erro subtrai pontos', () => {
        let player = makePlayer();
        let result = CurriculumEngine.updateNodeMastery(player, 'add_simple', true);
        expect(result.nodeMastery.add_simple.points).toBe(60);

        player = makePlayer(result.nodeMastery);
        result = CurriculumEngine.updateNodeMastery(player, 'add_simple', false);
        expect(result.nodeMastery.add_simple.points).toBe(35); // 60 - 25
    });

    it('acerto rápido demais (baixa confiança) vale menos pontos', () => {
        const player = makePlayer();
        const result = CurriculumEngine.updateNodeMastery(player, 'add_simple', true, undefined, true);
        expect(result.nodeMastery.add_simple.points).toBe(20);
    });

    it('erro registra o distrator escolhido (sinal diagnóstico)', () => {
        const player = makePlayer();
        const result = CurriculumEngine.updateNodeMastery(player, 'add_simple', false, '7');
        expect(result.nodeMastery.add_simple.misconceptions).toEqual({ '7': 1 });
    });

    it('pontos nunca ficam negativos', () => {
        const player = makePlayer();
        const result = CurriculumEngine.updateNodeMastery(player, 'add_simple', false);
        expect(result.nodeMastery.add_simple.points).toBe(0);
    });

    it('promove o nó ao bater o threshold com o mínimo de tentativas', () => {
        let player = makePlayer();
        let result;
        // add_simple: threshold 250, 60 pontos por acerto -> precisa de 5 acertos.
        for (let i = 0; i < 5; i++) {
            result = CurriculumEngine.updateNodeMastery(player, 'add_simple', true);
            player = makePlayer(result.nodeMastery);
        }
        player.nodeMastery!.add_simple.reviewDueAt = '2020-01-01T00:00:00.000Z';
        result = CurriculumEngine.updateNodeMastery(player, 'add_simple', true);
        expect(result!.promoted).toBe(true);
        expect(result!.masteredNode?.id).toBe('add_simple');
        expect(result!.nodeMastery.add_simple.mastered).toBe(true);
    });

    it('NÃO promove antes do mínimo de tentativas, mesmo com pontos suficientes', () => {
        // Simula pontos altos vindos de fora (ex.: import/migração) mas poucas tentativas.
        const player = makePlayer({
            add_simple: { nodeId: 'add_simple', points: 240, attempts: 1, successes: 1, mastered: false }
        });
        const result = CurriculumEngine.updateNodeMastery(player, 'add_simple', true); // vai a 300 pontos, 2 tentativas
        expect(result.promoted).toBe(false);
    });

    it('ao promover, reporta um vizinho desbloqueado quando existe', () => {
        const player = makePlayer({
            add_simple: { nodeId: 'add_simple', points: 240, attempts: 5, successes: 5, mastered: false, reviewDueAt: '2020-01-01T00:00:00.000Z' }
        });
        const result = CurriculumEngine.updateNodeMastery(player, 'add_simple', true);
        expect(result.promoted).toBe(true);
        expect(result.newNode).toBeDefined();
        expect(['sub_simple', 'add_two_digits', 'mult_intro', 'seq_simple']).toContain(result.newNode!.id);
    });

    it('não promove de novo um nó já dominado', () => {
        const player = makePlayer({ add_simple: mastered('add_simple') });
        const result = CurriculumEngine.updateNodeMastery(player, 'add_simple', true);
        expect(result.promoted).toBe(false);
    });
});
