-- Relatório de "Dopamina Semanal": agregados por semana para cada usuário
-- Preenchido pela Edge Function que roda todo domingo à noite

CREATE TABLE IF NOT EXISTS weekly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date date NOT NULL,
  total_focus_minutes int NOT NULL DEFAULT 0,
  longest_task_title text,
  longest_task_minutes int,
  estimation_precision_percent int,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);

CREATE INDEX IF NOT EXISTS idx_weekly_reports_user_week ON weekly_reports(user_id, week_start_date DESC);

ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weekly reports"
  ON weekly_reports FOR SELECT
  USING (auth.uid() = user_id);

-- Inserções/updates vêm da Edge Function com service_role (sem política INSERT para usuário)
