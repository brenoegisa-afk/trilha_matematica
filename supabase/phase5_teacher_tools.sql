-- ============================================
-- FASE 5: Ferramentas do Professor (Foco & Customização)
-- ============================================

-- 1. Adicionar o "Foco da Aula" na tabela de turmas (classes)
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS active_focus_skill TEXT DEFAULT NULL;

-- 2. Criar a tabela de Questões Customizadas do Professor
CREATE TABLE IF NOT EXISTS public.custom_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    options JSONB NOT NULL,
    skill_id TEXT NOT NULL, -- Para linkar com BNCC/tags
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- RLS (Segurança de Linha) para custom_questions
-- ============================================
ALTER TABLE public.custom_questions ENABLE ROW LEVEL SECURITY;

-- Limpar policies se já existirem (idempotência)
DROP POLICY IF EXISTS "Professor gerencia questões da sua turma" ON public.custom_questions;
DROP POLICY IF EXISTS "Alunos podem ler questões da sua turma" ON public.custom_questions;

-- O Professor que criou a turma pode gerenciar as questões customizadas dela
CREATE POLICY "Professor gerencia questões da sua turma"
ON public.custom_questions FOR ALL
USING (
    class_id IN (
        SELECT id FROM public.classes WHERE teacher_id = auth.uid()
    )
);

-- Alunos podem ler as questões customizadas da sua turma.
-- ❌ Removido: OR auth.uid() IS NULL (liberava leitura a qualquer anônimo).
-- O aluno lê via user_id = auth.uid() (após student_login reivindicar o perfil).
CREATE POLICY "Alunos podem ler questões da sua turma"
ON public.custom_questions FOR SELECT
USING (
    class_id IN (
        SELECT (class_id::uuid) FROM public.profiles WHERE user_id = auth.uid()
    )
);
