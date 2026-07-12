-- ============================================
-- FASE 0: RLS Policies Corrigidas — Trilha dos Campeões
-- ============================================
-- ⚠️  Executar no Supabase Dashboard > SQL Editor
-- ⚠️  Este script SUBSTITUI todas as policies anteriores.
--     Rode UMA VEZ. Se precisar re-rodar, ele já faz DROP IF EXISTS.
-- ============================================

-- ============================================
-- 1. profiles — Isolamento estrito
-- ============================================

-- Limpar policies antigas e novas (Garante idempotência do script)
DROP POLICY IF EXISTS "Anyone can insert profiles"              ON profiles;
DROP POLICY IF EXISTS "Users can read own profiles"             ON profiles;
DROP POLICY IF EXISTS "Users and Parents can read profiles"      ON profiles;
DROP POLICY IF EXISTS "Users can update own profiles"           ON profiles;
DROP POLICY IF EXISTS "Authenticated or anon can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Restricted profile read"                  ON profiles;
DROP POLICY IF EXISTS "Owner can update own profile"             ON profiles;
DROP POLICY IF EXISTS "Teacher can delete student profiles"      ON profiles;

DROP POLICY IF EXISTS "Insert game session with class"           ON game_sessions;
DROP POLICY IF EXISTS "Scoped read game_sessions"                ON game_sessions;

DROP POLICY IF EXISTS "Anyone can lookup class by access_code"  ON classes;
DROP POLICY IF EXISTS "Teacher manages own classes"             ON classes;
DROP POLICY IF EXISTS "Teacher updates own classes"             ON classes;
DROP POLICY IF EXISTS "Teacher deletes own classes"             ON classes;

DROP POLICY IF EXISTS "Parent reads own links"                  ON parent_student;
DROP POLICY IF EXISTS "Parent insert blocked until consent flow" ON parent_student;

DROP POLICY IF EXISTS "Anyone can read schools"                 ON schools;
DROP POLICY IF EXISTS "Schools insert blocked via RLS"          ON schools;

-- INSERT: Qualquer requisição autenticada pode criar perfil.
-- O aluno usará anon-auth do Supabase (signInAnonymously na Fase 1).
-- Até lá, permitimos anon insert para não quebrar o fluxo atual,
-- mas COM restrição: o perfil criado DEVE ter um class_id válido.
-- INSERT: exige sessão (professor autenticado cria alunos; aluno anônimo
-- com sessão sincroniza o próprio perfil). Bloqueia inserção sem login.
CREATE POLICY "Authenticated or anon can insert profiles"
ON profiles FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL
);

-- SELECT: Somente o próprio dono, o professor da turma, ou pai vinculado.
-- ❌ Removido: OR user_id IS NULL (lia perfis de qualquer anônimo)
-- ❌ Removido: OR auth.uid() IS NULL (qualquer request sem auth lia tudo)
-- ❌ Removido: ramo anônimo por class_id (lia toda a turma sem login).
--    O roster "escolha seu nome" agora vem da RPC get_class_roster
--    (phase8_frente1_security.sql), que devolve só id + name.
CREATE POLICY "Restricted profile read"
ON profiles FOR SELECT
USING (
    -- O próprio usuário autenticado (inclui aluno anônimo que já reivindicou
    -- o perfil via student_login → user_id = auth.uid())
    (user_id IS NOT NULL AND user_id = auth.uid())
    -- Professor vê alunos da sua turma
    OR class_id IN (
        SELECT id FROM classes WHERE teacher_id = auth.uid()
    )
    -- Pai vê filhos vinculados (exige parent_student com consent)
    OR id IN (
        SELECT student_id FROM parent_student
        WHERE parent_id = auth.uid()
    )
);

-- UPDATE: Somente o dono (aluno que reivindicou o perfil via student_login,
-- ou professor/pai autenticado) pode atualizar.
-- ❌ Removido: OR user_id IS NULL (permitia qualquer anônimo sobrescrever
--    o perfil de qualquer aluno). Agora o aluno tem user_id = auth.uid().
CREATE POLICY "Owner can update own profile"
ON profiles FOR UPDATE
USING (
    (user_id IS NOT NULL AND user_id = auth.uid())
    OR class_id IN (
        SELECT id FROM classes WHERE teacher_id = auth.uid()
    )
)
WITH CHECK (
    (user_id IS NOT NULL AND user_id = auth.uid())
    OR class_id IN (
        SELECT id FROM classes WHERE teacher_id = auth.uid()
    )
);

-- DELETE: Somente professor da turma pode remover perfil de aluno.
CREATE POLICY "Teacher can delete student profiles"
ON profiles FOR DELETE
USING (
    class_id IN (
        SELECT id FROM classes WHERE teacher_id = auth.uid()
    )
);


-- ============================================
-- 2. game_sessions — Escopado por turma/professor
-- ============================================

DROP POLICY IF EXISTS "Allow public insert to game_sessions"          ON game_sessions;
DROP POLICY IF EXISTS "Allow select based on player_id"               ON game_sessions;
DROP POLICY IF EXISTS "Authenticated users can insert game_sessions"  ON game_sessions;
DROP POLICY IF EXISTS "Authenticated users can read game_sessions"    ON game_sessions;

-- INSERT: Qualquer um pode inserir (o aluno manda a sessão ao final do jogo).
-- Mas exige class_id preenchido para rastreabilidade.
CREATE POLICY "Insert game session with class"
ON game_sessions FOR INSERT
WITH CHECK (
    class_id IS NOT NULL
);

-- SELECT: Professor vê sessões da sua turma; aluno vê as próprias.
CREATE POLICY "Scoped read game_sessions"
ON game_sessions FOR SELECT
USING (
    -- Professor vê sessões da turma
    class_id IN (
        SELECT id::text FROM classes WHERE teacher_id = auth.uid()
    )
    -- Ou o próprio jogador vê suas sessões
    OR player_id = auth.uid()::text
);


-- ============================================
-- 3. classes — Isolamento por teacher_id
-- ============================================

DROP POLICY IF EXISTS "Classes are viewable by everyone"    ON classes;
DROP POLICY IF EXISTS "Teachers can manage own classes"     ON classes;

-- SELECT: Qualquer um pode buscar turma por access_code (necessário no Setup),
-- mas só retorna id e access_code (a RLS não filtra colunas, então o frontend
-- deve fazer .select('id, access_code') — isso é documentação, não enforcement).
CREATE POLICY "Anyone can lookup class by access_code"
ON classes FOR SELECT
USING (true);
-- ⚠️  Idealmente restringir colunas via view. Por ora, os dados
--     da tabela classes (nome, teacher_id) não são sensíveis.

-- INSERT/UPDATE/DELETE: Somente o professor dono.
CREATE POLICY "Teacher manages own classes"
ON classes FOR INSERT
TO authenticated
WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teacher updates own classes"
ON classes FOR UPDATE
TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teacher deletes own classes"
ON classes FOR DELETE
TO authenticated
USING (teacher_id = auth.uid());


-- ============================================
-- 4. parent_student — Desativado até Fase 1
-- ============================================
-- A policy atual permite que qualquer pai vincule qualquer student_id
-- sem consentimento. Isso é uma brecha grave.
-- Solução provisória: travar INSERT até haver um consent_code.

DROP POLICY IF EXISTS "Parents can read their own links"  ON parent_student;
DROP POLICY IF EXISTS "Parents can insert links"          ON parent_student;

-- SELECT: Pai só vê seus próprios vínculos.
CREATE POLICY "Parent reads own links"
ON parent_student FOR SELECT
USING (parent_id = auth.uid());

-- INSERT: BLOQUEADO até Fase 1 implementar consent_code.
-- O WITH CHECK (false) impede qualquer inserção.
CREATE POLICY "Parent insert blocked until consent flow"
ON parent_student FOR INSERT
WITH CHECK (false);


-- ============================================
-- 5. schools — Leitura pública, escrita restrita
-- ============================================

DROP POLICY IF EXISTS "Anyone can read schools for registration"      ON schools;
DROP POLICY IF EXISTS "Only admins or system can insert schools"      ON schools;

CREATE POLICY "Anyone can read schools"
ON schools FOR SELECT
USING (true);

-- INSERT: Somente admin (role check ou service_role key).
-- Por ora, bloqueamos insert via RLS; escolas são criadas via Dashboard.
CREATE POLICY "Schools insert blocked via RLS"
ON schools FOR INSERT
WITH CHECK (false);


-- ============================================
-- ✅ FASE 0 COMPLETA — Policies restritivas aplicadas.
-- Próximo: Fase 1 (signInAnonymously, consent_code, PIN de aluno)
-- ============================================
