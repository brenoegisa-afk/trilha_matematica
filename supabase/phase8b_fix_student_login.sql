-- ============================================
-- FIX: student_login — "PIN Incorreto" com PIN correto
-- ============================================
-- Causa: no Supabase a extensão pgcrypto normalmente vive no schema
-- `extensions`, mas a função tinha `SET search_path = public`, então
-- `digest()` não era encontrado e a RPC falhava (o cliente mostrava
-- "PIN Incorreto"). Correção: incluir `extensions` no search_path.
--
-- Bônus: passa a retornar node_mastery para hidratar a progressão do
-- grafo curricular ao logar em outro aparelho.
--
-- Rode este arquivo no SQL Editor do Supabase (após phase8_frente1_security.sql).
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Necessário porque estamos ALTERANDO o tipo de retorno (adicionando
-- node_mastery). CREATE OR REPLACE sozinho não muda o retorno de uma
-- função existente (erro 42P13) — por isso removemos antes.
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
    node_mastery jsonb
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

    -- Verifica o PIN (hash SHA-256, mesmo formato do hashPin no cliente)
    -- e reivindica o perfil para esta sessão.
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
               p.user_id, p.skills_mastery, p.srs_reviews, p.node_mastery
        FROM public.profiles p
        WHERE p.id = p_student_id;
END;
$$;

REVOKE ALL ON FUNCTION public.student_login(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.student_login(uuid, text) TO anon, authenticated;

-- ============================================
-- Diagnóstico opcional: confira o que está gravado para um aluno.
-- Troque o nome e rode SÓ o SELECT abaixo para comparar os hashes.
--
--   SELECT name,
--          secret_code AS hash_guardado,
--          encode(digest('1234','sha256'),'hex') AS hash_do_pin_1234
--   FROM public.profiles WHERE name = 'Breno';
--
-- Se `hash_guardado` for NULL ou diferente do hash do PIN que você
-- distribuiu, o aluno foi criado por outro caminho — recrie-o pelo
-- "Gerenciar Alunos" para gerar um PIN novo e válido.
-- ============================================
