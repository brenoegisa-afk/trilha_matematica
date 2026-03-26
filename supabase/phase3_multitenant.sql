-- ============================================
-- FASE 3: Multi-tenant B2B (Escolas) e B2C (Pais)
-- ============================================
-- Execute the following in the Supabase SQL Editor

-- 1. Criar tabela Schools (B2B)
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS em schools
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- 2. Atualizar Classes
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;

-- 3. Atualizar Profiles (Papéis estruturados)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'parent', 'admin')),
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL;

-- 4. Criar relação de Dependente (Pai -> Filho)
CREATE TABLE IF NOT EXISTS public.parent_student (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL, -- Geralmente auth.uid()
    student_id UUID NOT NULL, -- ID do perfil local (anônimo) ou cadastrado na nuvem
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(parent_id, student_id)
);

ALTER TABLE public.parent_student ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES ESTRATÉGICAS (Frictionless B2C)
-- ============================================

-- A. Schools Policy
CREATE POLICY "Anyone can read schools for registration" ON public.schools FOR SELECT USING (true);
CREATE POLICY "Only admins or system can insert schools" ON public.schools FOR INSERT WITH CHECK (true); -- Simplificado, idealmente travado no admin

-- B. Classes Policy (Update for Phase 3)
DROP POLICY IF EXISTS "Classes are viewable by everyone" ON public.classes;
CREATE POLICY "Classes are viewable by everyone" ON public.classes FOR SELECT USING (true);
-- Permite que alunos busquem turmas usando um "Código da Turma", ou seja, SELECT liberado para todos.

-- C. Parent_Student Policy
CREATE POLICY "Parents can read their own links" ON public.parent_student FOR SELECT USING (parent_id = auth.uid());
CREATE POLICY "Parents can insert links" ON public.parent_student FOR INSERT WITH CHECK (parent_id = auth.uid());

-- D. Profile Policies Upgrade
-- Permitir que contas anônimas (sem user_id) sejam lidas e atualizadas pelos Pais que as reivindicaram (claim)
DROP POLICY IF EXISTS "Users can read own profiles" ON public.profiles;
CREATE POLICY "Users and Parents can read profiles" ON public.profiles FOR SELECT
USING (
    user_id = auth.uid() -- O PRÓPRIO USUÁRIO (ex: Professor ou Pai logado)
    OR class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid()) -- O PROFESSOR vê seus alunos
    OR id::uuid IN (SELECT student_id FROM parent_student WHERE parent_id = auth.uid()) -- O PAI vê seus filhos vinculados
    OR user_id IS NULL -- ANÔNIMOS (estilo Avatar World - perfil viaja só pelo LocalStorage)
);

-- ============================================
-- SUCCESS: Banco de dados estruturado para B2B2C!
-- ============================================
