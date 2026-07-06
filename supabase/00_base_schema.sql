-- ============================================
-- SCHEMA BASE INICIAL (Tabelas do MVP Fase 0 e 1)
-- ============================================

-- 1. Tabela Classes (Turmas)
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    access_code TEXT NOT NULL,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela Profiles (Alunos/Usuários)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    secret_code TEXT,
    stars INTEGER DEFAULT 0,
    equipped_avatar TEXT,
    unlocked_avatars JSONB DEFAULT '[]'::jsonb,
    games_played INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    equipped_mascot TEXT,
    unlocked_mascots JSONB DEFAULT '[]'::jsonb,
    streak INTEGER DEFAULT 1,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    last_sync TIMESTAMPTZ DEFAULT NOW(),
    session_stats JSONB DEFAULT '{}'::jsonb
);

-- 3. Tabela Teacher Questions (Perguntas Customizadas)
CREATE TABLE IF NOT EXISTS public.teacher_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    grade_level TEXT,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    options JSONB NOT NULL,
    skill_id TEXT,
    difficulty TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Habilitar RLS nas tabelas base
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_questions ENABLE ROW LEVEL SECURITY;
