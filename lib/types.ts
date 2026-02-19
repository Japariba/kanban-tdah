export type Priority = 'low' | 'medium' | 'high'
export type TaskSize = 'small' | 'medium' | 'large'
export type TaskColumn = 'backlog' | 'today' | 'doing' | 'done'

export type Task = {
  id: string
  title: string
  column: TaskColumn
  priority: Priority
  size?: TaskSize
  completed_at?: string | null
  user_id?: string
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
