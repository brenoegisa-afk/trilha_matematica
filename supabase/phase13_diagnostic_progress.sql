-- FASE 13: progresso do diagnóstico por eixo
-- Execute manualmente no Supabase SQL Editor, após revisar.

CREATE TABLE IF NOT EXISTS public.diagnostic_progress (
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL,
    skill_id TEXT NOT NULL,
    curriculum_version TEXT NOT NULL DEFAULT 'v1',
    entry_node_id TEXT,
    evidence_count SMALLINT NOT NULL DEFAULT 0 CHECK (evidence_count >= 0 AND evidence_count <= 12),
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'insufficient_evidence')),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (student_id, subject_id, skill_id, curriculum_version)
);

ALTER TABLE public.diagnostic_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Student manages own diagnostic progress" ON public.diagnostic_progress;
DROP POLICY IF EXISTS "Teacher reads class diagnostic progress" ON public.diagnostic_progress;
DROP POLICY IF EXISTS "Parent reads linked diagnostic progress" ON public.diagnostic_progress;

CREATE POLICY "Student manages own diagnostic progress"
ON public.diagnostic_progress FOR ALL TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = diagnostic_progress.student_id AND p.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = diagnostic_progress.student_id AND p.user_id = auth.uid()));

CREATE POLICY "Teacher reads class diagnostic progress"
ON public.diagnostic_progress FOR SELECT TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.profiles p JOIN public.classes c ON c.id = p.class_id
    WHERE p.id = diagnostic_progress.student_id AND c.teacher_id = auth.uid()
));

CREATE POLICY "Parent reads linked diagnostic progress"
ON public.diagnostic_progress FOR SELECT TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.parent_student ps
    WHERE ps.student_id = diagnostic_progress.student_id AND ps.parent_id = auth.uid()
));

REVOKE ALL ON public.diagnostic_progress FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE ON public.diagnostic_progress TO anon, authenticated;
