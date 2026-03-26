-- ============================================
-- FIX: RLS Policies para Trilha dos Campeões
-- ============================================
-- Aplicar no Supabase Dashboard > SQL Editor

-- ============================================
-- 1. game_sessions — Segurança por autenticação
-- ============================================

-- Remover policies antigas inseguras
DROP POLICY IF EXISTS "Allow public insert to game_sessions" ON game_sessions;
DROP POLICY IF EXISTS "Allow select based on player_id" ON game_sessions;

-- INSERT: Somente usuários autenticados podem inserir sessões
CREATE POLICY "Authenticated users can insert game_sessions"
ON game_sessions FOR INSERT
TO authenticated
WITH CHECK (true);

-- SELECT: Usuários autenticados podem ver sessões
-- (será refinado com school_id na Fase 3)
CREATE POLICY "Authenticated users can read game_sessions"
ON game_sessions FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- 2. profiles — Isolamento por user_id
-- ============================================

-- Permitir que qualquer um crie perfil (necessário para fluxo de Setup)
CREATE POLICY "Anyone can insert profiles"
ON profiles FOR INSERT
WITH CHECK (true);

-- SELECT: usuários veem seus próprios perfis + professores veem alunos da turma
CREATE POLICY "Users can read own profiles"
ON profiles FOR SELECT
USING (
    user_id = auth.uid()
    OR class_id IN (
        SELECT id FROM classes WHERE teacher_id = auth.uid()
    )
    OR auth.uid() IS NULL  -- Anon access for login flow
);

-- UPDATE: somente o próprio usuário pode atualizar seu perfil
CREATE POLICY "Users can update own profiles"
ON profiles FOR UPDATE
USING (
    user_id = auth.uid()
    OR user_id IS NULL  -- Allow claiming unclaimed profiles
)
WITH CHECK (true);

-- ============================================
-- 3. classes — Isolamento por teacher_id
-- ============================================

-- Professores só veem suas próprias turmas
CREATE POLICY "Teachers can manage own classes"
ON classes FOR ALL
TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

-- ============================================
-- NOTA: Aplicar refinamento com school_id na Fase 3
-- quando a entidade School for criada.
-- ============================================
