-- Garantir RLS na tabela tasks (auth.uid() = user_id)
-- e campo estimated_time_minutes para relatório estimado vs real (foco TDAH)

-- 1. Campo de estimativa de tempo (minutos: 15, 30, 60, etc.)
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS estimated_time_minutes int CHECK (estimated_time_minutes IS NULL OR estimated_time_minutes > 0);

-- 2. RLS na tabela tasks (se ainda não existir)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Remover política antiga se existir com outro nome, depois criar a correta
DROP POLICY IF EXISTS "Users can manage own tasks" ON tasks;
CREATE POLICY "Users can manage own tasks"
  ON tasks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Confirmar: focus_sessions já tem ON DELETE CASCADE em task_id (001_kanban_tdah_features.sql)
-- Nenhuma alteração necessária; deleção de task remove as focus_sessions vinculadas.
