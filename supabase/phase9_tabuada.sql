-- ============================================
-- FASE 9: Fluência da Tabuada (modo Tabuada)
-- ============================================
-- 1) Coluna para guardar o domínio por fato da tabuada.
-- 2) student_login passa a retornar tabuada_mastery (para hidratar entre aparelhos).
--
-- Rode este arquivo no SQL Editor do Supabase (após phase8b_fix_student_login.sql).
-- IMPORTANTE: rode ANTES de publicar o código que grava tabuada_mastery, senão o
-- upsert do perfil falha por coluna inexistente.
-- ============================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS tabuada_mastery JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN profiles.tabuada_mastery IS 'Fluência por fato da tabuada. Formato: { "7x8": { "a":7,"b":8,"score":number,"attempts":number,"correct":number,"mastered":boolean } }';

-- Recria student_login incluindo tabuada_mastery no retorno (muda o tipo → DROP antes).
DROP FUNCTION IF EXISTS public.student_login(uuid, text);

CREATE OR REPLACE FUNCTION public.student_login(p_student_id uuid, p_pin text)
RETURNS TABLE (
    id uuid,
    name text,
    class_id uuid,
    total_score integer,
    stars integer,
    streak integer,
    user_id uuid,
    skills_mastery jsonb,
    srs_reviews jsonb,
    node_mastery jsonb,
    tabuada_mastery jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_uid uuid := auth.uid();
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'É necessária uma sessão (mesmo anônima) para login.';
    END IF;

    UPDATE public.profiles p
       SET user_id = v_uid,
           last_sync = now()
     WHERE p.id = p_student_id
       AND p.secret_code = encode(digest(p_pin, 'sha256'), 'hex');

    IF NOT FOUND THEN
        RETURN; -- PIN incorreto ou aluno inexistente
    END IF;

    RETURN QUERY
        SELECT p.id, p.name, p.class_id, p.total_score, p.stars, p.streak,
               p.user_id, p.skills_mastery, p.srs_reviews, p.node_mastery, p.tabuada_mastery
        FROM public.profiles p
        WHERE p.id = p_student_id;
END;
$$;

REVOKE ALL ON FUNCTION public.student_login(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.student_login(uuid, text) TO anon, authenticated;

-- ✅ Fase 9 aplicada.
