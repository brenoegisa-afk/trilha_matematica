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

    it('recua de verdade quando o pré-requisito ainda não está dominado', () => {
        // Cenário só alcançável via fallback de série (grade bypassa pré-requisitos,
        // ver teste "BUG CONHECIDO" abaixo): seq_mult (prereq: seq_pattern, mult_tables)
        // entrou em prática sem ter os dois pré-requisitos batidos. seq_pattern está OK,
        // mult_tables nunca foi treinado (0 pontos) — é ele que deve ser recomendado.
        const player = makePlayer({
            seq_pattern: mastered('seq_pattern'),
            seq_mult: { nodeId: 'seq_mult', points: 50, attempts: 6, successes: 1, mastered: false }
        });
        const node = CurriculumEngine.pickNode(player, 'math', undefined, '3-4');
        expect(node.id).toBe('mult_tables');
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

    it('BUG CONHECIDO: série sem nó correspondente na fronteira pula pré-requisitos', () => {
        // Aluno começando do zero, mas com a série "5" selecionada: todos os nós
        // de grade "5" são depth 5, então o motor entrega um nó de profundidade
        // máxima sem o aluno ter passado por nada antes. Documentado no ROADMAP.md
        // (§2 "Outros gaps") como causa raiz do salto de estágio do herói.
        const player = makePlayer();
        const node = CurriculumEngine.pickNode(player, 'math', undefined, '5');
        expect(node.grade).toBe('5');
        expect(node.depth).toBe(5);
        expect(node.prerequisites.length).toBeGreaterThan(0); // pré-requisitos existem...
        // ...mas nenhum foi dominado — a seleção ignorou isso de propósito (fallback por série).
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
            add_simple: { nodeId: 'add_simple', points: 240, attempts: 4, successes: 4, mastered: false }
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
