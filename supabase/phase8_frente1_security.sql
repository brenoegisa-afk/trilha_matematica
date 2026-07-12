-- ============================================
-- FRENTE 1: Segurança — Auth anônima do aluno + RPCs server-side
-- ============================================
-- Objetivo: fechar o vazamento de dados de crianças.
--   * O aluno passa a ter uma sessão real (signInAnonymously) → auth.uid().
--   * O roster ("escolha seu nome") vem por RPC e devolve SÓ id + name.
--   * O PIN é verificado NO SERVIDOR; o hash (secret_code) nunca sai do banco.
--
-- ORDEM: rode este arquivo DEPOIS de `fix_rls_policies.sql`.
-- PRÉ-REQUISITO no painel Supabase:
--   Authentication > Sign In / Providers > habilitar "Anonymous sign-ins".
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- --------------------------------------------
-- 1. get_class_roster(access_code)
--    Substitui o `.from('profiles').select('*')` do cliente (que vazava
--    secret_code + notas de toda a turma). Devolve apenas id + name.
--    SECURITY DEFINER: roda com privilégio do dono, ignorando a RLS,
--    mas expõe SÓ as duas colunas do RETURNS TABLE.
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.get_class_roster(p_access_code text)
RETURNS TABLE (id uuid, name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT p.id, p.name
    FROM public.profiles p
    JOIN public.classes c ON c.id = p.class_id
    WHERE upper(c.access_code) = upper(p_access_code)
    ORDER BY p.name;
$$;

REVOKE ALL ON FUNCTION public.get_class_roster(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_class_roster(text) TO anon, authenticated;

-- --------------------------------------------
-- 2. student_login(student_id, pin)
--    Verifica o PIN comparando o hash SHA-256 (mesmo formato gerado no
--    cliente por hashPin) NO SERVIDOR. Se bater, "reivindica" o perfil
--    para a sessão atual (user_id = auth.uid()) e devolve os dados do
--    aluno — SEM a coluna secret_code. Se não bater, retorna vazio.
-- --------------------------------------------
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
    srs_reviews jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid uuid := auth.uid();
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'É necessária uma sessão (mesmo anônima) para login.';
    END IF;

    -- Verifica o PIN e reivindica o perfil para esta sessão.
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
               p.user_id, p.skills_mastery, p.srs_reviews
        FROM public.profiles p
        WHERE p.id = p_student_id;
END;
$$;

REVOKE ALL ON FUNCTION public.student_login(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.student_login(uuid, text) TO anon, authenticated;

-- ============================================
-- ✅ FRENTE 1 (server-side) aplicada.
-- Lembrete: as policies restritivas de profiles/custom_questions estão
-- em fix_rls_policies.sql e phase5_teacher_tools.sql (já corrigidos).
-- ============================================
