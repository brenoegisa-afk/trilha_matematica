-- Tabela para armazenar o histórico de partidas (Sessões)
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id TEXT NOT NULL,
    class_id TEXT,
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    accuracy FLOAT DEFAULT 0,
    xp_gained INTEGER DEFAULT 0,
    skill_stats JSONB DEFAULT '{}'::jsonb,
    finished_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para busca rápida por aluno ou turma
CREATE INDEX idx_sessions_player ON game_sessions (player_id);
CREATE INDEX idx_sessions_class ON game_sessions (class_id);

-- Permissões de RLS (Row Level Security)
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Permitir inserção pública (ou autenticada se preferir)
CREATE POLICY "Allow public insert to game_sessions" 
ON game_sessions FOR INSERT 
WITH CHECK (true);

-- Permitir leitura baseada no class_id para professores (ou por player_id)
CREATE POLICY "Allow select based on player_id" 
ON game_sessions FOR SELECT 
USING (true); -- Ajustar conforme necessidade de privacidade
