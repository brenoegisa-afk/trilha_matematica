-- Fase 6: Limpeza de Arquitetura (Drop Teacher Questions)
-- Estamos migrando todas as questões customizadas para a tabela `custom_questions`, que tem suporte ao `skill_id`.
-- Portanto, a tabela antiga `teacher_questions` não é mais necessária.

DROP TABLE IF EXISTS public.teacher_questions;

-- Também garantindo que o app atualize o schema caso use postgrest cache:
NOTIFY pgrst, 'reload schema';
