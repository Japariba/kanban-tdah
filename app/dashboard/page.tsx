'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabaseClient'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd'
import toast, { Toaster } from 'react-hot-toast'
import type { Task, Subtask } from '@/lib/types'
import { POINTS_BY_SIZE } from '@/lib/types'
import TaskCard from './components/TaskCard'
import FocusTimer from './components/FocusTimer'
import DailyNotesSection from './components/DailyNotesSection'
import FocusNotifications from './components/FocusNotifications'

const COLUMNS = ['backlog', 'today', 'doing', 'done'] as const

const COLUMN_STYLES: Record<string, string> = {
  backlog: 'bg-gray-900',
  today: 'bg-yellow-900/40',
  doing: 'bg-blue-900/40',
  done: 'bg-green-900/40',
}

const COLUMN_TITLES: Record<string, string> = {
  backlog: 'Backlog',
  today: 'Hoje',
  doing: 'Fazendo',
  done: 'Concluído',
}

const MAX_TODAY = 3
const MAX_DOING = 1

function normalizeTask(t: Record<string, unknown>): Task {
  return {
    id: t.id as string,
    title: t.title as string,
    column: (t.column as Task['column']) ?? 'backlog',
    priority: (t.priority as Task['priority']) ?? 'medium',
    size: (t.size as Task['size']) ?? 'medium',
    completed_at: t.completed_at as string | null | undefined,
    user_id: t.user_id as string | undefined,
  }
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [subtasksByTask, setSubtasksByTask] = useState<Record<string, Subtask[]>>({})
  const [newTask, setNewTask] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('medium')
  const [newTaskSize, setNewTaskSize] = useState<Task['size']>('medium')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editPriority, setEditPriority] = useState<Task['priority']>('medium')
  const [editSize, setEditSize] = useState<Task['size']>('medium')
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userStats, setUserStats] = useState({ points: 0, streak_days: 0 })
  const [authChecked, setAuthChecked] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const [focusTask, setFocusTask] = useState<Task | null>(null)
  const [focusModeOnly, setFocusModeOnly] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseClient()

  const fetchTasks = useCallback(
    async (uid: string) => {
      if (!supabase) return
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', uid)
      if (error) {
        console.error(error)
        toast.error('Erro ao carregar tarefas')
        return
      }
      setTasks(((data as Record<string, unknown>[]) ?? []).map(normalizeTask))

      const taskIds = ((data as { id: string }[]) ?? []).map((t) => t.id)
      if (taskIds.length === 0) {
        setSubtasksByTask({})
        return
      }
      const { data: subData } = await supabase
        .from('subtasks')
        .select('*')
        .in('task_id', taskIds)
      const byTask: Record<string, Subtask[]> = {}
      for (const st of (subData as Subtask[]) ?? []) {
        if (!byTask[st.task_id]) byTask[st.task_id] = []
        byTask[st.task_id].push(st)
      }
      setSubtasksByTask(byTask)
    },
    [supabase]
  )

  const fetchUserStats = useCallback(
    async (uid: string) => {
      if (!supabase) return
      const { data } = await supabase
        .from('user_stats')
        .select('points, streak_days')
        .eq('user_id', uid)
        .maybeSingle()
      if (data) setUserStats({ points: data.points ?? 0, streak_days: data.streak_days ?? 0 })
    },
    [supabase]
  )

  useEffect(() => {
    const client = getSupabaseClient()
    if (!client) {
      setAuthChecked(true)
      return
    }
    const auth = client.auth
    async function getUser() {
      const {
        data: { user },
      } = await auth.getUser()

      if (user) {
        setUserId(user.id)
        setUserEmail(user.email ?? null)
        await fetchTasks(user.id)
        await fetchUserStats(user.id)
      }
      setAuthChecked(true)
    }
    getUser()
  }, [fetchTasks, fetchUserStats])

  useEffect(() => {
    if (!authChecked) return
    if (supabase && !userId) {
      router.replace('/login')
    }
  }, [authChecked, supabase, userId, router])

  async function handleLogout() {
    if (supabase) await supabase.auth.signOut()
    window.location.href = '/login'
  }

  async function addTask() {
    if (!userId || !supabase) return
    const title = newTask.trim()
    if (!title) {
      toast.error('Digite o título da tarefa')
      return
    }

    const { error } = await supabase.from('tasks').insert([
      {
        title,
        column: 'backlog',
        user_id: userId,
        priority: newTaskPriority,
        size: newTaskSize,
      },
    ])

    if (error) {
      console.error(error)
      toast.error('Erro ao criar tarefa')
      return
    }

    toast.success('Tarefa criada')
    setNewTask('')
    await fetchTasks(userId)
  }

  async function addSubtask(taskId: string, title: string) {
    if (!supabase) return
    const { error } = await supabase.from('subtasks').insert([{ task_id: taskId, title }])
    if (error) {
      console.error(error)
      toast.error('Erro ao adicionar subtarefa')
      return
    }
    const task = tasks.find((t) => t.id === taskId)
    if (task) await fetchTasks(userId!)
  }

  async function toggleSubtask(subtaskId: string, done: boolean) {
    if (!supabase) return
    const { error } = await supabase.from('subtasks').update({ done }).eq('id', subtaskId)
    if (error) {
      console.error(error)
      return
    }
    await fetchTasks(userId!)
  }

  async function handleFocusComplete(taskId: string, durationMinutes: number) {
    if (!userId || !supabase) return
    const { error } = await supabase.from('focus_sessions').insert([
      { task_id: taskId, user_id: userId, duration_minutes: durationMinutes },
    ])
    if (error) console.error(error)
    setFocusTask(null)
  }

  async function confirmDelete() {
    const task = taskToDelete
    setTaskToDelete(null)
    if (!task || !userId || !supabase) return

    const { error } = await supabase.from('tasks').delete().eq('id', task.id)

    if (error) {
      console.error(error)
      toast.error('Erro ao excluir tarefa')
      return
    }

    toast.success('Tarefa removida')
    await fetchTasks(userId)
  }

  function openEditModal(task: Task) {
    setEditingTask(task)
    setEditTitle(task.title)
    setEditPriority(task.priority ?? 'medium')
    setEditSize(task.size ?? 'medium')
  }

  async function saveEdit() {
    if (!editingTask || !supabase) return
    if (!editTitle.trim()) return

    const { error } = await supabase
      .from('tasks')
      .update({
        title: editTitle.trim(),
        priority: editPriority,
        size: editSize,
      })
      .eq('id', editingTask.id)

    if (error) {
      console.error(error)
      toast.error('Erro ao atualizar tarefa')
      return
    }

    toast.success('Tarefa atualizada')
    setEditingTask(null)
    setEditTitle('')
    if (userId) await fetchTasks(userId)
  }

  async function onDragEnd(result: DropResult) {
    if (!result.destination || !supabase || !userId) return

    const taskId = result.draggableId
    const newColumn = result.destination.droppableId as Task['column']

    if (newColumn === 'today') {
      const todayCount = tasks.filter((t) => t.column === 'today').length
      if (todayCount >= MAX_TODAY) {
        toast.error('Você já tem 3 tarefas no Hoje.')
        return
      }
    }

    if (newColumn === 'doing') {
      const doingCount = tasks.filter((t) => t.column === 'doing').length
      if (doingCount >= MAX_DOING) {
        toast.error('Você já está executando uma tarefa.')
        return
      }
    }

    const previousTasks = tasks
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, column: newColumn } : t
      )
    )

    const task = tasks.find((t) => t.id === taskId)
    const isMovingToDone = newColumn === 'done'
    const updatePayload: Record<string, unknown> = { column: newColumn }
    if (isMovingToDone) updatePayload.completed_at = new Date().toISOString()

    const { error } = await supabase
      .from('tasks')
      .update(updatePayload)
      .eq('id', taskId)

    if (error) {
      console.error(error)
      setTasks(previousTasks)
      toast.error('Erro ao mover tarefa')
      return
    }

    if (isMovingToDone && task && userId && supabase) {
      const size = task.size ?? 'medium'
      const points = POINTS_BY_SIZE[size]
      const today = new Date().toISOString().slice(0, 10)
      const { data: stats } = await supabase
        .from('user_stats')
        .select('points, streak_days, last_activity_date')
        .eq('user_id', userId)
        .maybeSingle()
      const prevPoints = (stats?.points as number) ?? 0
      const prevStreak = (stats?.streak_days as number) ?? 0
      const lastDate = stats?.last_activity_date as string | null
      const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10)
      const newStreak = lastDate === yesterday ? prevStreak + 1 : lastDate === today ? prevStreak : 1
      await supabase.from('user_stats').upsert(
        {
          user_id: userId,
          points: prevPoints + points,
          streak_days: newStreak,
          last_activity_date: today,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      await fetchUserStats(userId)
    }

    if (userId) await fetchTasks(userId)
  }

  if (!supabase) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
        <p>Configuração indisponível. Verifique as variáveis de ambiente.</p>
      </main>
    )
  }

  if (!authChecked || !userId) {
    return <main className="min-h-screen bg-gray-950" />
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Toaster position="top-right" />

      <header className="border-b border-gray-800 bg-gray-900 px-6 py-4 flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-xl font-semibold">Meu Foco do Dia</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-amber-400" title="Pontos">
            ★ {userStats.points}
          </span>
          {userStats.streak_days > 0 && (
            <span className="text-sm text-emerald-400" title="Sequência de dias">
              🔥 {userStats.streak_days} dias
            </span>
          )}
          <Link
            href="/history"
            className="text-sm text-gray-300 hover:text-white underline"
          >
            Histórico
          </Link>
          <button
            type="button"
            onClick={() => setFocusModeOnly((v) => !v)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              focusModeOnly ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Modo foco
          </button>
          <span className="text-sm text-gray-300">{userEmail}</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Sair
          </button>
        </div>
      </header>

      <section className="p-6">
        <DailyNotesSection userId={userId} getSupabase={getSupabaseClient} />

        <FocusNotifications
          todayCount={tasks.filter((t) => t.column === 'today').length}
          doingCount={tasks.filter((t) => t.column === 'doing').length}
        />

        <div className="mb-8 flex gap-2 flex-wrap items-end">
          <div>
            <label htmlFor="new-task-input" className="sr-only">
              Nova tarefa
            </label>
            <input
              id="new-task-input"
              className="bg-gray-800 border border-gray-700 p-3 rounded-lg w-72 text-white placeholder-gray-400"
              placeholder="Nova tarefa..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
            />
          </div>
          <select
            value={newTaskPriority}
            onChange={(e) => setNewTaskPriority(e.target.value as Task['priority'])}
            className="bg-gray-800 border border-gray-700 p-3 rounded-lg text-white text-sm"
            aria-label="Prioridade"
          >
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
          </select>
          <select
            value={newTaskSize}
            onChange={(e) => setNewTaskSize(e.target.value as Task['size'])}
            className="bg-gray-800 border border-gray-700 p-3 rounded-lg text-white text-sm"
            aria-label="Tamanho"
          >
            <option value="small">Pequena (5 pts)</option>
            <option value="medium">Média (10 pts)</option>
            <option value="large">Grande (20 pts)</option>
          </select>
          <button
            onClick={addTask}
            className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-lg font-medium transition"
          >
            Adicionar
          </button>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className={`grid gap-6 ${focusModeOnly ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-4'}`}>
            {(focusModeOnly ? (['today', 'doing'] as const) : COLUMNS).map((col) => (
              <Droppable droppableId={col} key={col}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`${COLUMN_STYLES[col]} p-4 rounded-2xl min-h-[400px] border border-gray-800`}
                  >
                    <h2 className="font-semibold text-lg mb-4 text-white">
                      {COLUMN_TITLES[col]}
                    </h2>

                    {tasks
                      .filter((task) => task.column === col)
                      .map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <TaskCard
                                task={task}
                                subtasks={subtasksByTask[task.id] ?? []}
                                onEdit={openEditModal}
                                onDelete={setTaskToDelete}
                                onStartFocus={col === 'doing' ? setFocusTask : undefined}
                                onAddSubtask={addSubtask}
                                onToggleSubtask={toggleSubtask}
                                isDoingColumn={col === 'doing'}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>

        {editingTask && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-10"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-task-title"
          >
            <div className="bg-gray-900 p-6 rounded-2xl shadow w-96 border border-gray-800">
              <h2 id="edit-task-title" className="text-lg font-semibold mb-4">
                Editar tarefa
              </h2>
              <label htmlFor="edit-task-input" className="sr-only">
                Título da tarefa
              </label>
              <input
                id="edit-task-input"
                className="bg-gray-800 border border-gray-700 p-3 rounded w-full mb-3 text-white"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
              />
              <div className="flex gap-4 mb-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Prioridade</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as Task['priority'])}
                    className="bg-gray-800 border border-gray-700 p-2 rounded w-full text-white text-sm"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Tamanho (pontos)</label>
                  <select
                    value={editSize}
                    onChange={(e) => setEditSize(e.target.value as Task['size'])}
                    className="bg-gray-800 border border-gray-700 p-2 rounded w-full text-white text-sm"
                  >
                    <option value="small">Pequena (5)</option>
                    <option value="medium">Média (10)</option>
                    <option value="large">Grande (20)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveEdit}
                  className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}

        {focusTask && (
          <FocusTimer
            task={focusTask}
            onClose={() => setFocusTask(null)}
            onComplete={handleFocusComplete}
          />
        )}

        {taskToDelete && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-10"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-task-title"
          >
            <div className="bg-gray-900 p-6 rounded-2xl shadow w-80 border border-gray-800">
              <h2 id="delete-task-title" className="text-lg font-semibold mb-2">
                Excluir tarefa
              </h2>
              <p className="text-gray-300 mb-4">
                Deseja realmente excluir &quot;{taskToDelete.title}&quot;?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setTaskToDelete(null)}
                  className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
