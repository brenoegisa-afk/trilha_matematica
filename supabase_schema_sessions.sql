-- ============================================
-- Schema: game_sessions
-- ============================================
-- ⚠️  As RLS policies deste arquivo foram MOVIDAS para
--     supabase/fix_rls_policies.sql para evitar conflitos.
--     Este arquivo contém apenas DDL (schema).
-- ============================================

-- Tabela para armazenar o histórico de partidas (Sessões)
CREATE TABLE IF NOT EXISTS game_sessions (
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
CREATE INDEX IF NOT EXISTS idx_sessions_player ON game_sessions (player_id);
CREATE INDEX IF NOT EXISTS idx_sessions_class ON game_sessions (class_id);

-- Permissões de RLS (Row Level Security)
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- ⚠️  RLS POLICIES estão em supabase/fix_rls_policies.sql
--     NÃO duplique policies aqui.
