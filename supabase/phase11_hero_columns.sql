-- ============================================
-- FEAT: herói bíblico (equipped_hero/hero_config) cross-device
-- ============================================
-- Hoje a escolha de herói (Davi, Ester...) e a customização livre (companheiro,
-- aura) só sobrevivem em localStorage — ao contrário do avatar antigo, que já
-- sincroniza pelo Supabase. Num piloto de escola com tablet compartilhado, a
-- criança "perde" o herói ao trocar de aparelho. Esta migration adiciona as
-- colunas que faltam; o código do app (CloudSyncProvider, useGameStore,
-- student_login) já foi atualizado para lê-las/escrevê-las.
--
-- Rode este arquivo no SQL Editor do Supabase.
-- ============================================

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS equipped_hero TEXT,
    ADD COLUMN IF NOT EXISTS hero_config JSONB DEFAULT '{}'::jsonb;

-- ============================================
-- Atualiza a RPC student_login para devolver o herói no login cross-device
-- (mesma função de supabase/phase8b_fix_student_login.sql, só adicionando
-- as duas colunas novas ao retorno).
-- ============================================

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
    equipped_hero text,
    hero_config jsonb
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
               p.user_id, p.skills_mastery, p.srs_reviews, p.node_mastery,
               p.equipped_hero, p.hero_config
        FROM public.profiles p
        WHERE p.id = p_student_id;
END;
$$;

REVOKE ALL ON FUNCTION public.student_login(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.student_login(uuid, text) TO anon, authenticated;
