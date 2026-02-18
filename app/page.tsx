'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
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

const columns = ['backlog', 'today', 'doing', 'done'] as const

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState('')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)



  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }



  // Buscar tarefas
  async function fetchTasks(userId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      console.error(error)
      return
    }

    setTasks(data as Task[])
  }

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setUserId(user.id)
        setUserEmail(user.email ?? null)
        fetchTasks(user.id)
      } else {
        window.location.href = '/login'
      }
    }

    getUser()
  }, [])




  // Criar tarefa
  async function addTask() {
    if (!userId) return

    const { error } = await supabase.from('tasks').insert([
      {
        title: newTask,
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
    if (userId) fetchTasks(userId)

  }

  // Excluir tarefa
  async function deleteTask(id: string) {
    const confirmDelete = confirm('Deseja realmente excluir esta tarefa?')
    if (!confirmDelete) return

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) {
      console.error(error)
      toast.error('Erro ao excluir tarefa')
      return
    }

    toast.success('Tarefa removida')


    if (userId) fetchTasks(userId)

  }

  // Editar tarefa
  function openEditModal(task: Task) {
    setEditingTask(task)
    setEditTitle(task.title)
  }

  async function saveEdit() {
    if (!editingTask) return
    if (!editTitle.trim()) return

    const { error } = await supabase
      .from('tasks')
      .update({ title: editTitle })
      .eq('id', editingTask.id)

    if (error) {
      console.error(error)
      toast.error('Erro ao atualizar tarefa')
      return
    }

    toast.success('Tarefa atualizada')


    setEditingTask(null)
    setEditTitle('')
    if (userId) fetchTasks(userId)

  }



  // Drag end
  async function onDragEnd(result: DropResult) {
    if (!result.destination) return

    const taskId = result.draggableId
    const newColumn = result.destination.droppableId as Task['column']

    // Regra today
    if (newColumn === 'today') {
      const todayCount = tasks.filter((t) => t.column === 'today').length
      if (todayCount >= 3) {
        alert('Você já tem 3 tarefas no Hoje.')
        return
      }
    }

    // Regra doing
    if (newColumn === 'doing') {
      const doingCount = tasks.filter((t) => t.column === 'doing').length
      if (doingCount >= 1) {
        alert('Você já está executando uma tarefa.')
        return
      }
    }

    const { error } = await supabase
      .from('tasks')
      .update({ column: newColumn })
      .eq('id', taskId)

    if (error) {
      console.error(error)
      return
    }

    if (userId) fetchTasks(userId)

  }
  if (!userId) {
    return (
      <main className="p-6 text-white">
        <p>Redirecionando para login...</p>
      </main>
    )
  }

  return (
    <main className="p-6">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">
          Meu Foco do Dia
        </h1>

        <div className="flex items-center gap-4">
          <span className="text-white text-sm">
            {userEmail}
          </span>

          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            Sair
          </button>
        </div>
      </div>




      {/* Criar tarefa */}
      <div className="mb-6 flex gap-2">
        <input
          className="border p-2 rounded w-64"
          placeholder="Nova tarefa..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
        />
        <button
          onClick={addTask}
          className="bg-blue-500 text-white px-4 rounded"
        >
          Adicionar
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-4 gap-4">
          {columns.map((col) => {
            const columnStyles: Record<string, string> = {
              backlog: 'bg-gray-200',
              today: 'bg-yellow-200',
              doing: 'bg-blue-200',
              done: 'bg-green-200',
            }

            const columnTitles: Record<string, string> = {
              backlog: 'Backlog',
              today: 'Hoje',
              doing: 'Fazendo',
              done: 'Concluído',
            }

            return (
              <Droppable droppableId={col} key={col}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`${columnStyles[col]} p-4 rounded min-h-[400px]`}
                  >
                    <h2 className="font-bold text-lg mb-4 text-gray-800">
                      {columnTitles[col]}
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
                              className="bg-white p-3 rounded shadow mb-2 text-gray-800"
                            >
                              <div className="font-medium mb-2">
                                {task.title}
                              </div>

                              <div className="flex gap-2 text-sm">
                                <button
                                  onClick={() => openEditModal(task)}

                                  className="px-2 py-1 bg-blue-500 text-white rounded"
                                >
                                  Editar
                                </button>

                                <button
                                  onClick={() => deleteTask(task.id)}
                                  className="px-2 py-1 bg-red-500 text-white rounded"
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
            )
          })}
        </div>
      </DragDropContext>
      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow w-80">
            <h2 className="text-lg font-bold mb-4 text-gray-800">
              Editar tarefa
            </h2>

            <input
              className="border p-2 rounded w-full mb-4 text-gray-900 bg-white"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />



            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingTask(null)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancelar
              </button>

              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  )
}
