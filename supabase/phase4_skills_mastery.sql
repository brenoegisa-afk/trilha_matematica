-- ============================================
-- FASE 4: Skills Mastery & SRS — Trilha dos Campeões
-- ============================================
-- Execute no Supabase Dashboard > SQL Editor
-- Adiciona colunas para persistir maestria de habilidades
-- e fila de revisão espaçada (SRS) no perfil do aluno.
-- ============================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS skills_mastery JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS srs_reviews JSONB DEFAULT '[]'::jsonb;
