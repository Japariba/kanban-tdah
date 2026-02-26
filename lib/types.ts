export type Priority = 'low' | 'medium' | 'high'
export type TaskSize = 'small' | 'medium' | 'large'
export type TaskColumn = 'backlog' | 'today' | 'doing' | 'done'

/** Estimativa em minutos (ex: 15, 30, 60). Comparar com focus_sessions para autoconhecimento. */
export type EstimatedTimeMinutes = 15 | 30 | 45 | 60 | 90 | 120 | null

export type Task = {
  id: string
  title: string
  column: TaskColumn
  priority: Priority
  size?: TaskSize
  completed_at?: string | null
  user_id?: string
  /** Estimativa de tempo em minutos (opcional). Útil para relatório estimado vs real. */
  estimated_time_minutes?: number | null
}

export type Subtask = {
  id: string
  task_id: string
  title: string
  done: boolean
}

export type FocusSession = {
  id: string
  task_id: string
  user_id: string
  duration_minutes: number
  created_at: string
}

export type UserStats = {
  user_id: string
  points: number
  streak_days: number
  last_activity_date: string | null
}

export type DailyNote = {
  id: string
  user_id: string
  content: string
  date: string
}

/** Status da assinatura Stripe / feature gate */
export type SubscriptionStatus = 'free' | 'pro' | 'past_due' | 'canceled'
export type PlanTier = 'free' | 'pro'

export type Profile = {
  id: string
  stripe_customer_id: string | null
  subscription_status: SubscriptionStatus
  plan_tier: PlanTier
  updated_at: string
}

/** Limites do plano Free (feature gating) */
export const FREE_BACKLOG_MAX_TASKS = 15

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
}

export const PRIORITY_BORDER_COLORS: Record<Priority, string> = {
  low: 'border-l-green-500',
  medium: 'border-l-yellow-500',
  high: 'border-l-red-500',
}

export const SIZE_LABELS: Record<TaskSize, string> = {
  small: 'Pequena',
  medium: 'Média',
  large: 'Grande',
}

export const POINTS_BY_SIZE: Record<TaskSize, number> = {
  small: 5,
  medium: 10,
  large: 20,
}

/** Opções de estimativa de tempo para o usuário (autoconhecimento estimado vs real). */
export const ESTIMATED_TIME_OPTIONS: { value: number; label: string }[] = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 h' },
  { value: 90, label: '1h 30' },
  { value: 120, label: '2 h' },
]
