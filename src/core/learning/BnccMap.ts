/**
 * BnccMap — Mapeamento centralizado de habilidades BNCC
 * 
 * Liga cada skillId + grade ao código oficial da BNCC (Base Nacional Comum Curricular).
 * Referência: http://basenacionalcomum.mec.gov.br/
 */

import { getLegacyContentGrade } from './Grade';

interface BnccEntry {
    code: string;        // Ex: EF01MA06
    description: string; // Descrição da habilidade oficial
}

const bnccMapping: Record<string, Record<string, BnccEntry>> = {
    // ─── MATEMÁTICA ───
    math_basic: {
        '1-2': {
            code: 'EF01MA06',
            description: 'Construir fatos fundamentais da adição e utilizá-los em procedimentos de cálculo para resolver problemas.'
        },
        '3-4': {
            code: 'EF03MA03',
            description: 'Construir e utilizar fatos fundamentais da adição, subtração e multiplicação para o cálculo mental ou escrito.'
        },
        '5': {
            code: 'EF05MA07',
            description: 'Resolver e elaborar problemas de adição e subtração com números naturais e com números racionais.'
        }
    },
    math_logic: {
        '1-2': {
            code: 'EF02MA09',
            description: 'Construir sequências de números naturais em ordem crescente ou decrescente a partir de um número qualquer, utilizando uma regularidade estabelecida.'
        },
        '3-4': {
            code: 'EF04MA11',
            description: 'Identificar regularidades em sequências numéricas compostas por múltiplos de um número natural.'
        },
        '5': {
            code: 'EF05MA02',
            description: 'Ler, escrever e ordenar números racionais na forma decimal com compreensão das principais características do sistema de numeração decimal.'
        }
    },
    math_expressions: {
        '1-2': {
            code: 'EF02MA05',
            description: 'Construir fatos básicos da adição e utilizá-los no cálculo mental ou escrito.'
        },
        '3-4': {
            code: 'EF03MA04',
            description: 'Estabelecer a relação entre números naturais e pontos da reta numérica para utilizá-la na ordenação dos números naturais e também na construção de fatos da adição e da subtração.'
        },
        '5': {
            code: 'EF05MA08',
            description: 'Resolver e elaborar problemas de multiplicação e divisão com números naturais e com números racionais cuja representação decimal é finita.'
        }
    },

    // ─── PORTUGUÊS ───
    port_grammar: {
        '1-2': {
            code: 'EF01LP08',
            description: 'Relacionar elementos sonoros (sílabas, fonemas, partes de palavras) com sua representação escrita.'
        },
        '3-4': {
            code: 'EF03LP07',
            description: 'Identificar a função na leitura e usar na escrita ponto final, ponto de interrogação, ponto de exclamação e, em diálogos, travessão.'
        },
        '5': {
            code: 'EF05LP04',
            description: 'Diferenciar, na leitura de textos, vírgula, ponto e vírgula, dois-pontos e reconhecer, na leitura de textos, o efeito de sentido que decorre do uso de reticências, aspas, parênteses.'
        }
    },
    port_reading: {
        '1-2': {
            code: 'EF01LP16',
            description: 'Ler e compreender, em colaboração com os colegas e com a ajuda do professor, quadras, quadrinhas, parlendas, trava-línguas.'
        },
        '3-4': {
            code: 'EF03LP14',
            description: 'Planejar e produzir, em situações de ditado, textos curtos, de forma adequada ao contexto.'
        },
        '5': {
            code: 'EF05LP15',
            description: 'Ler/assistir e compreender, com autonomia, notícias, reportagens, vídeos em vlogs argumentativos, dentre outros gêneros do campo político-cidadão.'
        }
    },

    // ─── CIÊNCIAS ───
    sci_nature: {
        '1-2': {
            code: 'EF02CI04',
            description: 'Descrever características de plantas e animais (tamanho, forma, cor, fase da vida, local onde se desenvolvem etc.).'
        },
        '3-4': {
            code: 'EF03CI04',
            description: 'Identificar características sobre o modo de vida (o que comem, como se reproduzem, como se deslocam etc.) dos animais mais comuns no ambiente próximo.'
        },
        '5': {
            code: 'EF05CI06',
            description: 'Selecionar argumentos que justifiquem por que os sistemas digestório e respiratório são considerados corresponsáveis pelo processo de nutrição do organismo.'
        }
    },
    sci_body: {
        '1-2': {
            code: 'EF01CI02',
            description: 'Localizar, nomear e representar graficamente (por meio de desenhos) partes do corpo humano e explicar suas funções.'
        },
        '3-4': {
            code: 'EF04CI05',
            description: 'Descrever e destacar semelhanças e diferenças entre o ciclo da matéria e o fluxo de energia entre os componentes vivos e não vivos de um ecossistema.'
        },
        '5': {
            code: 'EF05CI06',
            description: 'Selecionar argumentos que justifiquem por que os sistemas digestório e respiratório são considerados corresponsáveis pelo processo de nutrição do organismo.'
        }
    }
};

export class BnccMap {
    /**
     * Retorna o código e a descrição da habilidade BNCC para um skillId e grade.
     */
    static getHabilidade(skillId: string, grade: string): BnccEntry | null {
        const skillMap = bnccMapping[skillId];
        if (!skillMap) return null;
        return skillMap[getLegacyContentGrade(grade)] || null;
    }

    /**
     * Retorna apenas o código BNCC (ex: EF01MA06), ou null se não mapeado.
     */
    static getCode(skillId: string, grade: string): string | null {
        const entry = this.getHabilidade(skillId, grade);
        return entry ? entry.code : null;
    }

    /**
     * Retorna uma string com todos os códigos BNCC associados a uma skill (ex: "EF01MA06 / EF03MA03")
     * Útil para o painel do professor onde a série pode ser mista.
     */
    static getAllCodesForSkill(skillId: string): string | null {
        const skillMap = bnccMapping[skillId];
        if (!skillMap) return null;
        const codes = Object.values(skillMap).map(entry => entry.code);
        // Remove duplicatas se houver
        const uniqueCodes = Array.from(new Set(codes));
        return uniqueCodes.join(' / ');
    }
}
