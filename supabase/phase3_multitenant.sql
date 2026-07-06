-- ============================================
-- FASE 3: Multi-tenant B2B (Escolas) e B2C (Pais)
-- ============================================
-- Execute the following in the Supabase SQL Editor
-- ⚠️  As RLS policies deste arquivo foram MOVIDAS para fix_rls_policies.sql
--     para evitar conflitos. Este arquivo contém apenas DDL (schema).
-- ============================================

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
-- Adicionada coluna consent_code para validar vínculo (Fase 0/1)
CREATE TABLE IF NOT EXISTS public.parent_student (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL,
    student_id UUID NOT NULL,
    consent_code TEXT,  -- Código fornecido pelo professor/escola para validar vínculo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(parent_id, student_id)
);

ALTER TABLE public.parent_student ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ⚠️  RLS POLICIES estão em fix_rls_policies.sql
--     NÃO duplique policies aqui.
-- ============================================
