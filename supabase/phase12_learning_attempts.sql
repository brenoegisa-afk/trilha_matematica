-- ============================================
-- FASE 12: Tentativas de aprendizagem append-only
-- Execute manualmente no Supabase SQL Editor após revisar as policies.
-- Esta migration não altera perfis existentes nem reutiliza a policy permissiva
-- de game_sessions: cada tentativa é autorizada pelo perfil dono.
-- ============================================

CREATE TABLE IF NOT EXISTS public.learning_attempts (
    attempt_id UUID PRIMARY KEY,
    session_id UUID NOT NULL,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    game_mode TEXT NOT NULL CHECK (game_mode IN ('trilha', 'arena', 'battle', 'tabuada')),
    node_id TEXT,
    skill_id TEXT,
    fact_id TEXT,
    question_ref TEXT,
    generator_version TEXT NOT NULL,
    item_format TEXT NOT NULL DEFAULT 'multiple_choice',
    selected_response TEXT,
    is_correct BOOLEAN NOT NULL,
    response_latency_ms INTEGER NOT NULL CHECK (response_latency_ms >= 0 AND response_latency_ms <= 3600000),
    attempt_number INTEGER NOT NULL CHECK (attempt_number >= 1),
    hint_count SMALLINT NOT NULL DEFAULT 0 CHECK (hint_count >= 0),
    support_level TEXT NOT NULL DEFAULT 'none' CHECK (support_level IN ('none', 'hint', 'visual', 'worked_example')),
    misconception_id TEXT,
    occurred_at TIMESTAMPTZ NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT learning_attempts_selected_response_size CHECK (
        selected_response IS NULL OR char_length(selected_response) <= 200
    )
);

COMMENT ON TABLE public.learning_attempts IS
    'Eventos append-only e idempotentes de aprendizagem. Não armazena nome, e-mail, IP, fingerprint ou enunciado completo.';

CREATE INDEX IF NOT EXISTS learning_attempts_student_occurred_idx
    ON public.learning_attempts (student_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS learning_attempts_class_occurred_idx
    ON public.learning_attempts (class_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS learning_attempts_node_occurred_idx
    ON public.learning_attempts (node_id, occurred_at DESC)
    WHERE node_id IS NOT NULL;

ALTER TABLE public.learning_attempts ENABLE ROW LEVEL SECURITY;

-- Reconstruível: remove somente as policies desta tabela.
DROP POLICY IF EXISTS "Student inserts own learning attempts" ON public.learning_attempts;
DROP POLICY IF EXISTS "Owner reads own learning attempts" ON public.learning_attempts;
DROP POLICY IF EXISTS "Teacher reads class learning attempts" ON public.learning_attempts;
DROP POLICY IF EXISTS "Parent reads linked child learning attempts" ON public.learning_attempts;

-- A associação do aluno e da turma é conferida no banco pelo perfil vinculado
-- ao auth.uid(). O cliente não pode inserir tentativa para outro aluno/turma.
CREATE POLICY "Student inserts own learning attempts"
ON public.learning_attempts FOR INSERT
TO anon, authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = learning_attempts.student_id
          AND p.user_id = auth.uid()
          AND p.class_id IS NOT DISTINCT FROM learning_attempts.class_id
    )
);

CREATE POLICY "Owner reads own learning attempts"
ON public.learning_attempts FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = learning_attempts.student_id
          AND p.user_id = auth.uid()
    )
);

CREATE POLICY "Teacher reads class learning attempts"
ON public.learning_attempts FOR SELECT
TO authenticated
USING (
    learning_attempts.class_id IN (
        SELECT c.id FROM public.classes c WHERE c.teacher_id = auth.uid()
    )
);

CREATE POLICY "Parent reads linked child learning attempts"
ON public.learning_attempts FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.parent_student ps
        WHERE ps.parent_id = auth.uid()
          AND ps.student_id = learning_attempts.student_id
    )
);

-- Não há policies UPDATE/DELETE: fatos aceitos são imutáveis. Fluxos de
-- exclusão/exportação serão implementados sob autorização adulta específica.
REVOKE ALL ON public.learning_attempts FROM PUBLIC;
GRANT INSERT, SELECT ON public.learning_attempts TO anon, authenticated;
