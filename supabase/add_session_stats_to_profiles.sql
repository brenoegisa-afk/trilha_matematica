-- ============================================================
-- PATCH Fase 3: Adicionar coluna session_stats à tabela profiles
-- ============================================================
-- Execute este arquivo no SQL Editor do Supabase.
-- Este comando é idempotente (IF NOT EXISTS).
-- ============================================================

-- 1. Adicionar coluna session_stats (JSONB) ao perfil do aluno
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS session_stats JSONB DEFAULT '{}'::jsonb;

-- 2. Adicionar índice GIN para buscas eficientes no JSONB
CREATE INDEX IF NOT EXISTS idx_profiles_session_stats
ON public.profiles USING GIN (session_stats);

-- 3. Garantir que a coluna last_sync existe (pode não existir em ambientes antigos)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_sync TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- NOTAS:
-- - session_stats guarda o snapshot da ÚLTIMA sessão de cada aluno
--   no formato: { "skill_id": { "attempts": N, "successes": N } }
-- - O histórico completo de partidas vive em game_sessions
-- - O TeacherSessionMonitor lê de AMBAS as tabelas:
--   * game_sessions: feed cronológico de partidas
--   * profiles.session_stats: diagnóstico atual por aluno
-- ============================================================
