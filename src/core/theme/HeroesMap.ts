/**
 * HeroesMap — Camada de Tema: Guerreiros e Guerreiras da Bíblia
 *
 * Pele narrativa da Trilha, plugada por cima do grafo curricular existente
 * (ver CurriculumGraph). NÃO altera o motor de aprendizagem: apenas dá
 * significado visual/emocional aos `skillId` e à profundidade dos nós.
 *
 * Modelo de duas camadas (decisão de produto):
 *   1. IDENTIDADE — a criança escolhe UM herói e *se torna* ele. O herói
 *      evolui visualmente conforme a maestria (armadura peça por peça).
 *   2. COLEÇÃO   — os demais heróis são desbloqueados ao conquistar os
 *      reinos (domínios) do grafo. Combustível de longo prazo.
 *
 * Tom: coragem, sabedoria e superação — NÃO violência. Josué (o mapa) liga
 * os quatro reinos: cada nó do grafo dominado = um pedaço de terra conquistado.
 */

// ═══════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════

/** Mecânica-âncora de cada herói (o "como" que ele representa no jogo). */
export type HeroMechanic =
    | 'boss'        // Davi — desafios acima do nível ("gigantes")
    | 'decision'    // Ester — escolher a resposta/rota certa sob pressão
    | 'streak'      // Gideão — cresce com a constância (ofensivas)
    | 'logic'       // Débora — sequências e padrões
    | 'progress'    // Josué — abre novos territórios do grafo
    | 'fluency';    // Rute — prática/fluência diária (tabuada)

/** Um estágio visual do herói, atrelado à profundidade do grafo (1 → 5). */
export interface HeroStage {
    depth: number;      // 1 = iniciante → 5 = maestria (espelha CurriculumNode.depth)
    title: string;      // Ex.: "Pastor", "Rei"
    visual: string;     // Descrição do visual/armadura ganho neste estágio
}

/** Um herói jogável — quem a criança escolhe e se torna. */
export interface Hero {
    id: string;
    name: string;
    gender: 'm' | 'f';
    virtue: string;        // O "porquê" — a virtude que o herói encarna
    mechanic: HeroMechanic;
    icon: string;          // Emoji-símbolo
    symbol: string;        // Arma/objeto característico (evolui com os estágios)
    tagline: string;       // Frase curta de identidade ("eu sou...")
    stages: HeroStage[];   // 5 estágios de evolução visual (depth 1 → 5)
}

/** Um reino = um domínio do grafo (skillId) vestido de território bíblico. */
export interface Realm {
    skillId: string;       // Liga ao CurriculumNode.skillId existente
    name: string;          // Nome do território
    patronHeroId: string;  // Herói-patrono (dá a narrativa do reino)
    starHeroId: string;    // Herói cuja mecânica mais brilha aqui
    icon: string;
    description: string;   // Narrativa curta do reino (para telas de entrada)
}

// ═══════════════════════════════════════════════════════════
// ROSTER — 6 HERÓIS JOGÁVEIS (3 guerreiros + 3 guerreiras)
// ═══════════════════════════════════════════════════════════

const HEROES: Hero[] = [
    {
        id: 'davi',
        name: 'Davi',
        gender: 'm',
        virtue: 'Coragem — o pequeno que vence o gigante',
        mechanic: 'boss',
        icon: '⚔️',
        symbol: 'Funda',
        tagline: 'Nenhum gigante é grande demais.',
        stages: [
            { depth: 1, title: 'Pastor', visual: 'Túnica simples e funda de pastor.' },
            { depth: 2, title: 'Corajoso', visual: 'Ganha um cinto de couro e a sacola de pedras.' },
            { depth: 3, title: 'Escudeiro', visual: 'Primeiro escudo e sandálias reforçadas.' },
            { depth: 4, title: 'Guerreiro', visual: 'Espada e peitoral leve de bronze.' },
            { depth: 5, title: 'Rei', visual: 'Coroa, manto e armadura real completa.' },
        ],
    },
    {
        id: 'ester',
        name: 'Ester',
        gender: 'f',
        virtue: 'Coragem estratégica — a decisão certa na hora certa',
        mechanic: 'decision',
        icon: '👑',
        symbol: 'Cetro real',
        tagline: 'A escolha certa muda tudo.',
        stages: [
            { depth: 1, title: 'Órfã', visual: 'Vestido simples de linho.' },
            { depth: 2, title: 'Escolhida', visual: 'Primeiras joias e véu bordado.' },
            { depth: 3, title: 'Dama do Palácio', visual: 'Manto de cores e tiara discreta.' },
            { depth: 4, title: 'Conselheira', visual: 'Cetro pequeno e anel real.' },
            { depth: 5, title: 'Rainha', visual: 'Coroa de joias, manto real e cetro completo.' },
        ],
    },
    {
        id: 'gideao',
        name: 'Gideão',
        gender: 'm',
        virtue: 'Superação — de medroso a herói',
        mechanic: 'streak',
        icon: '🔥',
        symbol: 'Tocha',
        tagline: 'A coragem cresce a cada dia.',
        stages: [
            { depth: 1, title: 'Escondido', visual: 'Roupa puída, olhar tímido, sem armas.' },
            { depth: 2, title: 'Chamado', visual: 'Pega a primeira tocha acesa.' },
            { depth: 3, title: 'Líder de Poucos', visual: 'Ganha capacete e trombeta.' },
            { depth: 4, title: 'Comandante', visual: 'Armadura parcial e estandarte.' },
            { depth: 5, title: 'Juiz de Israel', visual: 'Armadura completa, tocha e trombeta erguidas.' },
        ],
    },
    {
        id: 'debora',
        name: 'Débora',
        gender: 'f',
        virtue: 'Sabedoria e liderança — a estrategista',
        mechanic: 'logic',
        icon: '🌴',
        symbol: 'Cajado de juíza',
        tagline: 'Onde há padrão, há caminho.',
        stages: [
            { depth: 1, title: 'Ouvinte', visual: 'Manto simples sob a palmeira.' },
            { depth: 2, title: 'Sábia', visual: 'Ganha um cajado curto e xale bordado.' },
            { depth: 3, title: 'Conselheira', visual: 'Cajado maior e faixa de liderança.' },
            { depth: 4, title: 'Profetisa', visual: 'Manto de profetisa e diadema de folhas.' },
            { depth: 5, title: 'Juíza de Israel', visual: 'Cajado completo, trono sob a palmeira.' },
        ],
    },
    {
        id: 'josue',
        name: 'Josué',
        gender: 'm',
        virtue: 'Conquista — território por território',
        mechanic: 'progress',
        icon: '🎺',
        symbol: 'Trombeta',
        tagline: 'Sê forte e corajoso.',
        stages: [
            { depth: 1, title: 'Ajudante', visual: 'Túnica de servo, sem insígnia.' },
            { depth: 2, title: 'Espião Corajoso', visual: 'Capa de viagem e mapa na mão.' },
            { depth: 3, title: 'Portador da Trombeta', visual: 'Ganha a trombeta e sandálias de marcha.' },
            { depth: 4, title: 'Comandante', visual: 'Armadura de campanha e estandarte.' },
            { depth: 5, title: 'Conquistador', visual: 'Armadura completa, trombeta e estandarte da terra.' },
        ],
    },
    {
        id: 'rute',
        name: 'Rute',
        gender: 'f',
        virtue: 'Persistência — colher todo dia',
        mechanic: 'fluency',
        icon: '🌾',
        symbol: 'Feixe de trigo',
        tagline: 'Um pouco todo dia enche o celeiro.',
        stages: [
            { depth: 1, title: 'Respigadeira', visual: 'Vestido de trabalho e cesto vazio.' },
            { depth: 2, title: 'Trabalhadora Fiel', visual: 'Cesto com as primeiras espigas.' },
            { depth: 3, title: 'Leal', visual: 'Feixe de trigo nas mãos e lenço de colheita.' },
            { depth: 4, title: 'Herdeira', visual: 'Manto novo e celeiro ao fundo se enchendo.' },
            { depth: 5, title: 'Matriarca', visual: 'Vestes de honra, celeiro cheio, feixe dourado.' },
        ],
    },
];

// ═══════════════════════════════════════════════════════════
// REINOS — 4 DOMÍNIOS DE MATEMÁTICA VESTIDOS DE TERRITÓRIO
// (os skillId batem com os do CurriculumGraph)
// ═══════════════════════════════════════════════════════════

const REALMS: Realm[] = [
    {
        skillId: 'math_basic',
        name: 'Vale dos Fundamentos',
        patronHeroId: 'josue',   // patrono narrativo do reino inicial
        starHeroId: 'gideao',    // mecânica que mais brilha: constância
        icon: '🏞️',
        description: 'Onde toda jornada começa: juntar e separar, tijolo por tijolo, para erguer uma base firme.',
    },
    {
        skillId: 'math_expressions',
        name: 'Celeiros da Multiplicação',
        patronHeroId: 'rute',    // José multiplica/reparte; Rute encarna a colheita
        starHeroId: 'rute',      // fluência da tabuada
        icon: '🌾',
        description: 'Campos onde o trigo se multiplica e se reparte. Aqui a tabuada enche os celeiros.',
    },
    {
        skillId: 'math_logic',
        name: 'Torre da Sabedoria',
        patronHeroId: 'debora',
        starHeroId: 'debora',    // sequências e padrões
        icon: '🗼',
        description: 'Do alto se enxergam os padrões. Quem lê a regularidade, prevê o próximo passo.',
    },
    {
        skillId: 'math_fractions',
        name: 'Reino da Partilha',
        patronHeroId: 'ester',
        starHeroId: 'ester',     // decisão justa: repartir em partes certas
        icon: '🍞',
        description: 'A terra onde tudo se reparte em partes justas: metades, terços e quartos.',
    },
];

// ═══════════════════════════════════════════════════════════
// API PÚBLICA
// ═══════════════════════════════════════════════════════════

export class HeroesMap {
    /** Todos os heróis jogáveis. */
    static getAllHeroes(): Hero[] {
        return HEROES;
    }

    /** Um herói pelo id (ex.: 'davi'). */
    static getHero(heroId: string): Hero | undefined {
        return HEROES.find(h => h.id === heroId);
    }

    /** Heróis filtrados por gênero (para telas de escolha equilibradas). */
    static getHeroesByGender(gender: 'm' | 'f'): Hero[] {
        return HEROES.filter(h => h.gender === gender);
    }

    /** Todos os reinos (na ordem sugerida de apresentação). */
    static getAllRealms(): Realm[] {
        return REALMS;
    }

    /** O reino correspondente a um skillId do grafo. */
    static getRealmBySkill(skillId: string): Realm | undefined {
        return REALMS.find(r => r.skillId === skillId);
    }

    /**
     * Estágio visual atual de um herói dada a profundidade máxima já dominada
     * pelo aluno naquele domínio (0 = ainda não começou → mostra o estágio 1).
     */
    static getHeroStage(heroId: string, masteredDepth: number): HeroStage | undefined {
        const hero = this.getHero(heroId);
        if (!hero) return undefined;
        const clamped = Math.max(1, Math.min(masteredDepth, hero.stages.length));
        return hero.stages.find(s => s.depth === clamped);
    }

    /**
     * Heróis desbloqueados pela COLEÇÃO: o patrono de cada reino cujo domínio
     * o aluno já começou a conquistar (tem ao menos 1 nó dominado).
     * `masteredSkillIds` = skillId dos nós já dominados pelo aluno.
     */
    static getUnlockedHeroes(masteredSkillIds: Set<string>): Hero[] {
        const ids = new Set<string>();
        for (const realm of REALMS) {
            if (masteredSkillIds.has(realm.skillId)) {
                ids.add(realm.patronHeroId);
                ids.add(realm.starHeroId);
            }
        }
        return HEROES.filter(h => ids.has(h.id));
    }
}
