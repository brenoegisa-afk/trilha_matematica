/**
 * CurriculumGraph — Grafo de Progressão Curricular
 * 
 * Define a trilha de evolução do aluno como um grafo de dependências.
 * Cada nó representa uma sub-habilidade específica com pré-requisitos claros.
 * 
 * Baseado nas diretrizes do Curriculum Architect:
 * "O currículo é um grafo, não uma lista — modele as dependências."
 */

import type { Grade } from './Grade';

export interface CurriculumNode {
    id: string;                // Ex: "add_simple"
    name: string;              // Ex: "Soma até 10"
    skillId: string;           // Skill pai (ex: "math_basic")
    subjectId: string;         // Ex: "math"
    grade: string;             // Pool legado: "1-2", "3-4", "5" (ver getNodeGrade)
    bnccCode: string;          // Código BNCC oficial
    depth: number;             // 1 = mais fácil → 5 = mais difícil
    prerequisites: string[];   // IDs dos nós que devem estar dominados
    description: string;       // Descrição para o professor
    icon: string;              // Emoji para visualização
    masteryThreshold: number;  // Pontos necessários para "dominar" (default: 300)
}

// ═══════════════════════════════════════════════════════════
// GRAFO DE MATEMÁTICA
// ═══════════════════════════════════════════════════════════

const mathNodes: CurriculumNode[] = [
    // ─── PROFUNDIDADE 1 (1º Ano) ─── Fundamentos
    {
        id: 'add_simple',
        name: 'Soma até 10',
        skillId: 'math_basic',
        subjectId: 'math',
        grade: '1-2',
        bnccCode: 'EF01MA06',
        depth: 1,
        prerequisites: [],
        description: 'Somar dois números cuja soma não ultrapassa 10.',
        icon: '🍎',
        masteryThreshold: 250
    },
    {
        id: 'sub_simple',
        name: 'Subtração até 10',
        skillId: 'math_basic',
        subjectId: 'math',
        grade: '1-2',
        bnccCode: 'EF01MA06',
        depth: 1,
        prerequisites: [],
        description: 'Subtrair números simples com resultado positivo até 10.',
        icon: '🔻',
        masteryThreshold: 250
    },
    {
        id: 'seq_simple',
        name: 'Sequências Simples',
        skillId: 'math_logic',
        subjectId: 'math',
        grade: '1-2',
        bnccCode: 'EF02MA09',
        depth: 1,
        prerequisites: ['add_simple'],
        description: 'Identificar o próximo número em sequências de +1, +2.',
        icon: '🔢',
        masteryThreshold: 250
    },

    // ─── PROFUNDIDADE 2 (2º Ano) ─── Expansão
    {
        id: 'add_two_digits',
        name: 'Soma até 20',
        skillId: 'math_basic',
        subjectId: 'math',
        grade: '1-2',
        bnccCode: 'EF02MA05',
        depth: 2,
        prerequisites: ['add_simple'],
        description: 'Somar números cujo resultado vai até 20, sem reagrupamento.',
        icon: '➕',
        masteryThreshold: 300
    },
    {
        id: 'sub_two_digits',
        name: 'Subtração até 20',
        skillId: 'math_basic',
        subjectId: 'math',
        grade: '1-2',
        bnccCode: 'EF02MA05',
        depth: 2,
        prerequisites: ['sub_simple'],
        description: 'Subtrair números com minuendo até 20, sem empréstimo.',
        icon: '➖',
        masteryThreshold: 300
    },
    {
        id: 'mult_intro',
        name: 'Ideia de Multiplicação',
        skillId: 'math_expressions',
        subjectId: 'math',
        grade: '1-2',
        bnccCode: 'EF02MA05',
        depth: 2,
        prerequisites: ['add_simple'],
        description: 'Multiplicação como soma repetida (2+2+2 = 3x2).',
        icon: '✖️',
        masteryThreshold: 300
    },
    {
        id: 'seq_pattern',
        name: 'Sequências com Padrão',
        skillId: 'math_logic',
        subjectId: 'math',
        grade: '1-2',
        bnccCode: 'EF02MA09',
        depth: 2,
        prerequisites: ['seq_simple'],
        description: 'Descobrir o passo de uma sequência (+3, +5, etc.).',
        icon: '🧩',
        masteryThreshold: 300
    },

    // ─── PROFUNDIDADE 3 (3º Ano) ─── Consolidação
    {
        id: 'add_regroup',
        name: 'Soma com Reagrupamento',
        skillId: 'math_basic',
        subjectId: 'math',
        grade: '3-4',
        bnccCode: 'EF03MA03',
        depth: 3,
        prerequisites: ['add_two_digits'],
        description: 'Somar dezenas com vai-um (27 + 15 = 42).',
        icon: '🔄',
        masteryThreshold: 350
    },
    {
        id: 'sub_borrow',
        name: 'Subtração com Empréstimo',
        skillId: 'math_basic',
        subjectId: 'math',
        grade: '3-4',
        bnccCode: 'EF03MA03',
        depth: 3,
        prerequisites: ['sub_two_digits'],
        description: 'Subtrair com empréstimo (43 - 17 = 26).',
        icon: '🏦',
        masteryThreshold: 350
    },
    {
        id: 'mult_tables',
        name: 'Tabuada (2 a 5)',
        skillId: 'math_expressions',
        subjectId: 'math',
        grade: '3-4',
        bnccCode: 'EF03MA03',
        depth: 3,
        prerequisites: ['mult_intro'],
        description: 'Tabuada do 2, 3, 4 e 5.',
        icon: '📊',
        masteryThreshold: 350
    },
    {
        id: 'seq_mult',
        name: 'Múltiplos e Regularidades',
        skillId: 'math_logic',
        subjectId: 'math',
        grade: '3-4',
        bnccCode: 'EF04MA11',
        depth: 3,
        prerequisites: ['seq_pattern', 'mult_tables'],
        description: 'Identificar múltiplos e regularidades em sequências numéricas.',
        icon: '🔍',
        masteryThreshold: 350
    },
    {
        id: 'frac_intro',
        name: 'Frações Visuais',
        skillId: 'math_fractions',
        subjectId: 'math',
        grade: '3-4',
        bnccCode: 'EF03MA03',
        depth: 3,
        prerequisites: ['mult_intro'],
        description: 'Reconhecer metade, terço e quarto em figuras.',
        icon: '🍕',
        masteryThreshold: 300
    },

    // ─── PROFUNDIDADE 4 (4º Ano) ─── Aprofundamento
    {
        id: 'add_three_digit',
        name: 'Soma de Centenas',
        skillId: 'math_basic',
        subjectId: 'math',
        grade: '3-4',
        bnccCode: 'EF03MA03',
        depth: 4,
        prerequisites: ['add_regroup'],
        description: 'Somar números de 3 dígitos (347 + 258).',
        icon: '💯',
        masteryThreshold: 400
    },
    {
        id: 'sub_three_digit',
        name: 'Subtração de Centenas',
        skillId: 'math_basic',
        subjectId: 'math',
        grade: '3-4',
        bnccCode: 'EF03MA03',
        depth: 4,
        prerequisites: ['sub_borrow'],
        description: 'Subtrair números de 3 dígitos (500 - 237).',
        icon: '📉',
        masteryThreshold: 400
    },
    {
        id: 'mult_full',
        name: 'Tabuada Completa',
        skillId: 'math_expressions',
        subjectId: 'math',
        grade: '3-4',
        bnccCode: 'EF03MA03',
        depth: 4,
        prerequisites: ['mult_tables'],
        description: 'Tabuada do 6, 7, 8 e 9.',
        icon: '🏆',
        masteryThreshold: 400
    },
    {
        id: 'div_intro',
        name: 'Divisão Exata',
        skillId: 'math_expressions',
        subjectId: 'math',
        grade: '3-4',
        bnccCode: 'EF03MA03',
        depth: 4,
        prerequisites: ['mult_tables'],
        description: 'Divisão exata usando fatos da multiplicação (20 ÷ 4 = 5).',
        icon: '✂️',
        masteryThreshold: 400
    },
    {
        id: 'frac_equiv',
        name: 'Frações Equivalentes',
        skillId: 'math_fractions',
        subjectId: 'math',
        grade: '3-4',
        bnccCode: 'EF03MA03',
        depth: 4,
        prerequisites: ['frac_intro', 'mult_tables'],
        description: 'Entender que 1/2 = 2/4 = 3/6.',
        icon: '⚖️',
        masteryThreshold: 400
    },

    // ─── PROFUNDIDADE 5 (5º Ano) ─── Maestria
    {
        id: 'add_decimals',
        name: 'Soma com Decimais',
        skillId: 'math_basic',
        subjectId: 'math',
        grade: '5',
        bnccCode: 'EF05MA07',
        depth: 5,
        prerequisites: ['add_three_digit'],
        description: 'Somar números decimais (3.5 + 2.7).',
        icon: '🔬',
        masteryThreshold: 450
    },
    {
        id: 'multi_step',
        name: 'Problemas Multi-Etapa',
        skillId: 'math_basic',
        subjectId: 'math',
        grade: '5',
        bnccCode: 'EF05MA07',
        depth: 5,
        prerequisites: ['add_three_digit', 'sub_three_digit'],
        description: 'Problemas que exigem mais de uma operação para resolver.',
        icon: '🧠',
        masteryThreshold: 450
    },
    {
        id: 'mult_two_digit',
        name: 'Multiplicação por 2 Dígitos',
        skillId: 'math_expressions',
        subjectId: 'math',
        grade: '5',
        bnccCode: 'EF05MA08',
        depth: 5,
        prerequisites: ['mult_full'],
        description: 'Multiplicar por números de 2 dígitos (23 × 14).',
        icon: '🚀',
        masteryThreshold: 450
    },
    {
        id: 'frac_operations',
        name: 'Operações com Frações',
        skillId: 'math_fractions',
        subjectId: 'math',
        grade: '5',
        bnccCode: 'EF05MA07',
        depth: 5,
        prerequisites: ['frac_equiv'],
        description: 'Somar e subtrair frações com denominadores diferentes.',
        icon: '🎯',
        masteryThreshold: 450
    },
    {
        id: 'decimal_ordering',
        name: 'Decimais e Ordenação',
        skillId: 'math_logic',
        subjectId: 'math',
        grade: '5',
        bnccCode: 'EF05MA02',
        depth: 5,
        prerequisites: ['seq_mult', 'add_decimals'],
        description: 'Ler, escrever e ordenar números decimais.',
        icon: '📐',
        masteryThreshold: 450
    }
];

// ═══════════════════════════════════════════════════════════
// GRAFO DE PORTUGUÊS
// ═══════════════════════════════════════════════════════════

const portugueseNodes: CurriculumNode[] = [
    // ─── PROFUNDIDADE 1 ───
    {
        id: 'letters_syllables',
        name: 'Letras e Sílabas',
        skillId: 'port_grammar',
        subjectId: 'portuguese',
        grade: '1-2',
        bnccCode: 'EF01LP08',
        depth: 1,
        prerequisites: [],
        description: 'Identificar letras, sílabas e sons.',
        icon: '🔤',
        masteryThreshold: 250
    },
    {
        id: 'rhyme_sounds',
        name: 'Rimas e Sons',
        skillId: 'port_reading',
        subjectId: 'portuguese',
        grade: '1-2',
        bnccCode: 'EF01LP16',
        depth: 1,
        prerequisites: [],
        description: 'Identificar rimas em parlendas e quadrinhas.',
        icon: '🎵',
        masteryThreshold: 250
    },

    // ─── PROFUNDIDADE 2 ───
    {
        id: 'word_formation',
        name: 'Formação de Palavras',
        skillId: 'port_grammar',
        subjectId: 'portuguese',
        grade: '1-2',
        bnccCode: 'EF01LP08',
        depth: 2,
        prerequisites: ['letters_syllables'],
        description: 'Juntar sílabas para formar palavras e separar palavras em sílabas.',
        icon: '🧱',
        masteryThreshold: 300
    },
    {
        id: 'simple_reading',
        name: 'Leitura de Frases',
        skillId: 'port_reading',
        subjectId: 'portuguese',
        grade: '1-2',
        bnccCode: 'EF01LP16',
        depth: 2,
        prerequisites: ['rhyme_sounds', 'letters_syllables'],
        description: 'Ler e compreender frases curtas e simples.',
        icon: '📖',
        masteryThreshold: 300
    },

    // ─── PROFUNDIDADE 3 ───
    {
        id: 'punctuation',
        name: 'Pontuação Básica',
        skillId: 'port_grammar',
        subjectId: 'portuguese',
        grade: '3-4',
        bnccCode: 'EF03LP07',
        depth: 3,
        prerequisites: ['word_formation'],
        description: 'Usar ponto final, interrogação e exclamação corretamente.',
        icon: '❓',
        masteryThreshold: 350
    },
    {
        id: 'text_interpretation',
        name: 'Interpretação de Texto',
        skillId: 'port_reading',
        subjectId: 'portuguese',
        grade: '3-4',
        bnccCode: 'EF03LP14',
        depth: 3,
        prerequisites: ['simple_reading'],
        description: 'Ler um texto curto e responder perguntas sobre o conteúdo.',
        icon: '🔎',
        masteryThreshold: 350
    },

    // ─── PROFUNDIDADE 4 ───
    {
        id: 'grammar_classes',
        name: 'Classes de Palavras',
        skillId: 'port_grammar',
        subjectId: 'portuguese',
        grade: '3-4',
        bnccCode: 'EF03LP07',
        depth: 4,
        prerequisites: ['punctuation'],
        description: 'Identificar substantivos, adjetivos e verbos.',
        icon: '🏷️',
        masteryThreshold: 400
    },
    {
        id: 'text_genres',
        name: 'Gêneros Textuais',
        skillId: 'port_reading',
        subjectId: 'portuguese',
        grade: '3-4',
        bnccCode: 'EF03LP14',
        depth: 4,
        prerequisites: ['text_interpretation'],
        description: 'Diferenciar carta, receita, notícia e história.',
        icon: '📰',
        masteryThreshold: 400
    },

    // ─── PROFUNDIDADE 5 ───
    {
        id: 'advanced_punctuation',
        name: 'Pontuação Avançada',
        skillId: 'port_grammar',
        subjectId: 'portuguese',
        grade: '5',
        bnccCode: 'EF05LP04',
        depth: 5,
        prerequisites: ['grammar_classes'],
        description: 'Usar vírgula, dois-pontos, reticências e aspas com significado.',
        icon: '✍️',
        masteryThreshold: 450
    },
    {
        id: 'critical_reading',
        name: 'Leitura Crítica',
        skillId: 'port_reading',
        subjectId: 'portuguese',
        grade: '5',
        bnccCode: 'EF05LP15',
        depth: 5,
        prerequisites: ['text_genres'],
        description: 'Ler com autonomia e identificar o ponto de vista do autor.',
        icon: '🎓',
        masteryThreshold: 450
    }
];

// ═══════════════════════════════════════════════════════════
// GRAFO DE CIÊNCIAS
// ═══════════════════════════════════════════════════════════

const scienceNodes: CurriculumNode[] = [
    // ─── PROFUNDIDADE 1 ───
    {
        id: 'five_senses',
        name: 'Os 5 Sentidos',
        skillId: 'sci_body',
        subjectId: 'science',
        grade: '1-2',
        bnccCode: 'EF01CI02',
        depth: 1,
        prerequisites: [],
        description: 'Identificar os 5 sentidos e os órgãos associados.',
        icon: '👁️',
        masteryThreshold: 250
    },
    {
        id: 'animals_basic',
        name: 'Animais ao Redor',
        skillId: 'sci_nature',
        subjectId: 'science',
        grade: '1-2',
        bnccCode: 'EF02CI04',
        depth: 1,
        prerequisites: [],
        description: 'Identificar animais do dia-a-dia e suas características.',
        icon: '🐶',
        masteryThreshold: 250
    },

    // ─── PROFUNDIDADE 2 ───
    {
        id: 'body_parts',
        name: 'Partes do Corpo',
        skillId: 'sci_body',
        subjectId: 'science',
        grade: '1-2',
        bnccCode: 'EF01CI02',
        depth: 2,
        prerequisites: ['five_senses'],
        description: 'Nomear e localizar as partes principais do corpo humano.',
        icon: '🦴',
        masteryThreshold: 300
    },
    {
        id: 'plants_basic',
        name: 'Plantas ao Redor',
        skillId: 'sci_nature',
        subjectId: 'science',
        grade: '1-2',
        bnccCode: 'EF02CI04',
        depth: 2,
        prerequisites: ['animals_basic'],
        description: 'Características das plantas: raiz, caule, folha, flor, fruto.',
        icon: '🌱',
        masteryThreshold: 300
    },

    // ─── PROFUNDIDADE 3 ───
    {
        id: 'animal_habits',
        name: 'Hábitos dos Animais',
        skillId: 'sci_nature',
        subjectId: 'science',
        grade: '3-4',
        bnccCode: 'EF03CI04',
        depth: 3,
        prerequisites: ['animals_basic', 'plants_basic'],
        description: 'Alimentação, reprodução e locomoção dos animais.',
        icon: '🦁',
        masteryThreshold: 350
    },
    {
        id: 'body_systems_intro',
        name: 'Sistemas do Corpo (Intro)',
        skillId: 'sci_body',
        subjectId: 'science',
        grade: '3-4',
        bnccCode: 'EF04CI05',
        depth: 3,
        prerequisites: ['body_parts'],
        description: 'Noção dos sistemas digestório, respiratório e circulatório.',
        icon: '❤️',
        masteryThreshold: 350
    },

    // ─── PROFUNDIDADE 4 ───
    {
        id: 'ecosystems',
        name: 'Ecossistemas',
        skillId: 'sci_nature',
        subjectId: 'science',
        grade: '3-4',
        bnccCode: 'EF04CI05',
        depth: 4,
        prerequisites: ['animal_habits'],
        description: 'Cadeia alimentar, seres vivos e não vivos, matéria e energia.',
        icon: '🌍',
        masteryThreshold: 400
    },
    {
        id: 'nutrition',
        name: 'Nutrição e Saúde',
        skillId: 'sci_body',
        subjectId: 'science',
        grade: '3-4',
        bnccCode: 'EF04CI05',
        depth: 4,
        prerequisites: ['body_systems_intro'],
        description: 'Como o corpo obtém energia dos alimentos.',
        icon: '🥗',
        masteryThreshold: 400
    },

    // ─── PROFUNDIDADE 5 ───
    {
        id: 'body_systems_deep',
        name: 'Sistemas Integrados',
        skillId: 'sci_body',
        subjectId: 'science',
        grade: '5',
        bnccCode: 'EF05CI06',
        depth: 5,
        prerequisites: ['nutrition'],
        description: 'Como os sistemas digestório e respiratório trabalham juntos na nutrição.',
        icon: '🔬',
        masteryThreshold: 450
    },
    {
        id: 'environment_conservation',
        name: 'Conservação Ambiental',
        skillId: 'sci_nature',
        subjectId: 'science',
        grade: '5',
        bnccCode: 'EF05CI06',
        depth: 5,
        prerequisites: ['ecosystems'],
        description: 'Impacto humano nos ecossistemas e ações de conservação.',
        icon: '♻️',
        masteryThreshold: 450
    }
];

// ═══════════════════════════════════════════════════════════
// API PÚBLICA
// ═══════════════════════════════════════════════════════════

const ALL_NODES: CurriculumNode[] = [...mathNodes, ...portugueseNodes, ...scienceNodes];

export class CurriculumGraph {
    /**
     * Converte o agrupamento legado do grafo para a série individual atual.
     * Enquanto os pools ainda são agrupados, a profundidade já distingue os
     * anos: 1→1º, 2→2º, 3→3º, 4→4º e 5→5º.
     */
    static getNodeGrade(node: CurriculumNode): Grade {
        return String(Math.min(5, Math.max(1, node.depth))) as Grade;
    }

    /**
     * Retorna todos os nós do grafo.
     */
    static getAllNodes(): CurriculumNode[] {
        return ALL_NODES;
    }

    /**
     * Retorna todos os nós de um assunto.
     */
    static getNodesBySubject(subjectId: string): CurriculumNode[] {
        return ALL_NODES.filter(n => n.subjectId === subjectId);
    }

    /**
     * Retorna todos os nós de uma skill pai.
     */
    static getNodesBySkill(skillId: string): CurriculumNode[] {
        return ALL_NODES.filter(n => n.skillId === skillId);
    }

    /**
     * Retorna um nó pelo ID.
     */
    static getNode(nodeId: string): CurriculumNode | undefined {
        return ALL_NODES.find(n => n.id === nodeId);
    }

    /**
     * Retorna os nós raiz (sem pré-requisitos) de um assunto — ponto de partida.
     */
    static getRootNodes(subjectId: string): CurriculumNode[] {
        return ALL_NODES.filter(n => n.subjectId === subjectId && n.prerequisites.length === 0);
    }

    /**
     * Dado um conjunto de nós dominados, retorna os próximos nós desbloqueados.
     * Um nó é desbloqueado quando TODOS os seus pré-requisitos estão em masteredNodeIds.
     */
    static getUnlockedNodes(masteredNodeIds: Set<string>, subjectId?: string): CurriculumNode[] {
        let candidates = subjectId 
            ? ALL_NODES.filter(n => n.subjectId === subjectId)
            : ALL_NODES;

        return candidates.filter(node => {
            // Já dominado? Não é candidato
            if (masteredNodeIds.has(node.id)) return false;
            // Todos os pré-requisitos dominados?
            return node.prerequisites.every(prereq => masteredNodeIds.has(prereq));
        });
    }

    /**
     * Retorna os nós na "fronteira" do aluno — os mais avançados que ele pode praticar.
     * Usado pelo motor de questões para decidir o que perguntar.
     */
    static getFrontierNodes(masteredNodeIds: Set<string>, subjectId: string): CurriculumNode[] {
        const unlocked = this.getUnlockedNodes(masteredNodeIds, subjectId);
        
        if (unlocked.length === 0) {
            // Aluno já dominou tudo! Retorna os nós de profundidade máxima para revisão
            const subjectNodes = ALL_NODES.filter(n => n.subjectId === subjectId);
            const maxDepth = Math.max(...subjectNodes.map(n => n.depth));
            return subjectNodes.filter(n => n.depth === maxDepth);
        }

        return unlocked;
    }

    /**
     * Quando um aluno erra repetidamente um nó, verifica se o problema
     * está no pré-requisito (olha um nível abaixo).
     * Retorna o pré-requisito que precisa de reforço, ou null.
     */
    static findWeakPrerequisite(
        nodeId: string, 
        masteryPoints: Record<string, number>
    ): CurriculumNode | null {
        const node = this.getNode(nodeId);
        if (!node) return null;

        for (const prereqId of node.prerequisites) {
            const points = masteryPoints[prereqId] || 0;
            const prereqNode = this.getNode(prereqId);
            if (prereqNode && points < prereqNode.masteryThreshold) {
                return prereqNode;
            }
        }
        return null;
    }

    /**
     * Calcula a porcentagem de progresso de um assunto.
     */
    static getSubjectProgress(masteredNodeIds: Set<string>, subjectId: string): number {
        const subjectNodes = ALL_NODES.filter(n => n.subjectId === subjectId);
        if (subjectNodes.length === 0) return 0;
        const mastered = subjectNodes.filter(n => masteredNodeIds.has(n.id)).length;
        return Math.round((mastered / subjectNodes.length) * 100);
    }
}
