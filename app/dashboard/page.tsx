'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabaseClient'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd'
import toast, { Toaster } from 'react-hot-toast'

type Task = {
  id: string
  title: string
  column: 'backlog' | 'today' | 'doing' | 'done'
}

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

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState('')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
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
      setTasks((data as Task[]) ?? [])
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
      }
      setAuthChecked(true)
    }
    getUser()
  }, [fetchTasks])

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
  }

  async function saveEdit() {
    if (!editingTask || !supabase) return
    if (!editTitle.trim()) return

    const { error } = await supabase
      .from('tasks')
      .update({ title: editTitle.trim() })
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

    const { error } = await supabase
      .from('tasks')
      .update({ column: newColumn })
      .eq('id', taskId)

    if (error) {
      console.error(error)
      setTasks(previousTasks)
      toast.error('Erro ao mover tarefa')
      return
    }
  }

  if (!supabase) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
        <p>Configuração indisponível. Verifique as variáveis de ambiente.</p>
      </main>
    )
  }

  if (!authChecked || !userId) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
        <p>Redirecionando para login...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Toaster position="top-right" />

      <header className="border-b border-gray-800 bg-gray-900 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">Meu Foco do Dia</h1>
        <div className="flex items-center gap-4">
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
          <button
            onClick={addTask}
            className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-lg font-medium transition"
          >
            Adicionar
          </button>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {COLUMNS.map((col) => (
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
                              className="bg-gray-800 p-4 rounded-xl shadow mb-3 border border-gray-700"
                            >
                              <div className="font-medium mb-3">
                                {task.title}
                              </div>
                              <div className="flex gap-2 text-sm">
                                <button
                                  onClick={() => openEditModal(task)}
                                  className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700"
                                  aria-label={`Editar tarefa: ${task.title}`}
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => setTaskToDelete(task)}
                                  className="px-3 py-1 bg-red-600 rounded hover:bg-red-700"
                                  aria-label={`Excluir tarefa: ${task.title}`}
                                >
                                  Excluir
                                </button>
                              </div>
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
            <div className="bg-gray-900 p-6 rounded-2xl shadow w-80 border border-gray-800">
              <h2 id="edit-task-title" className="text-lg font-semibold mb-4">
                Editar tarefa
              </h2>
              <label htmlFor="edit-task-input" className="sr-only">
                Título da tarefa
              </label>
              <input
                id="edit-task-input"
                className="bg-gray-800 border border-gray-700 p-3 rounded w-full mb-4 text-white"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
              />
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
