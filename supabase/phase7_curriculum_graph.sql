-- Fase 7: Grafo Curricular
-- Adiciona a coluna para armazenar a progressão dos nós curriculares do aluno

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS node_mastery JSONB DEFAULT '{}'::jsonb;

-- Comentário da coluna para documentação
COMMENT ON COLUMN profiles.node_mastery IS 'Armazena a proficiência do aluno nos nós curriculares do grafo. Formato: { "nodeId": { "nodeId": string, "points": number, "attempts": number, "successes": number, "mastered": boolean } }';
