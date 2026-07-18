-- ============================================
-- FIX: aluno duplicado ao cadastrar (mesmo nome, mesma turma)
-- ============================================
-- Causa: "Adicionar Aluno" em StudentManager.tsx inseria uma linha nova em
-- `profiles` a cada clique, sem checar se já existia alguém com aquele nome
-- na turma — cada duplicata ganhava um PIN diferente (por isso o "PIN
-- Incorreto": o PIN antigo não bate com a cópia nova). O app já foi corrigido
-- para checar antes de inserir, mas isso sozinho não é à prova de corrida
-- (dois cliques quase simultâneos, ou duas abas abertas). Esta migration
-- garante no BANCO que isso nunca mais aconteça, não importa a origem.
--
-- Rode este arquivo no SQL Editor do Supabase.
-- ============================================

-- 1) DIAGNÓSTICO — rode isto primeiro para ver os duplicados existentes
--    (ex.: as cópias de teste "Teste Breno"). Não apaga nada.
--
--   SELECT class_id, lower(name) AS nome, count(*), array_agg(id) AS ids
--   FROM public.profiles
--   WHERE class_id IS NOT NULL
--   GROUP BY class_id, lower(name)
--   HAVING count(*) > 1;

-- 2) LIMPEZA (OPCIONAL, MANUAL) — revise a lista acima primeiro. Depois de
--    decidir qual `id` de cada grupo manter (ex.: o que já tem stars/score
--    de verdade), apague os outros um a um:
--
--   DELETE FROM public.profiles WHERE id = '<uuid-da-copia-a-remover>';
--
--    Só depois de zerar os duplicados existentes é que o índice abaixo
--    consegue ser criado (ele falha se ainda houver duplicata na tabela).

-- 3) TRAVA DEFINITIVA — impede duas linhas com o mesmo nome (sem diferenciar
--    maiúsculas/minúsculas) na mesma turma. class_id NULL (perfis avulsos,
--    fora de turma) não entra nessa regra.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_class_name_unique
    ON public.profiles (class_id, lower(name))
    WHERE class_id IS NOT NULL;
