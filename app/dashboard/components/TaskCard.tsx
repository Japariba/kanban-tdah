'use client'

import { useState } from 'react'
import type { Task, Subtask } from '@/lib/types'
import { PRIORITY_BORDER_COLORS } from '@/lib/types'

type TaskCardProps = {
  task: Task
  subtasks: Subtask[]
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onStartFocus?: (task: Task) => void
  onAddSubtask: (taskId: string, title: string) => void
  onToggleSubtask: (subtaskId: string, done: boolean) => void
  isDoingColumn: boolean
}

export default function TaskCard({
  task,
  subtasks,
  onEdit,
  onDelete,
  onStartFocus,
  onAddSubtask,
  onToggleSubtask,
  isDoingColumn,
}: TaskCardProps) {
  const priority = task.priority ?? 'medium'
  const borderClass = PRIORITY_BORDER_COLORS[priority]
  const total = subtasks.length
  const doneCount = subtasks.filter((s) => s.done).length
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [showSubtaskInput, setShowSubtaskInput] = useState(false)

  return (
    <div
      className={`bg-gray-800 p-4 rounded-xl shadow mb-3 border border-gray-700 border-l-4 ${borderClass}`}
    >
      <div className="font-medium mb-2">{task.title}</div>

      {total > 0 && (
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Subtarefas</span>
            <span>{doneCount}/{total}</span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <ul className="mt-1.5 space-y-1 text-sm text-gray-300">
            {subtasks.slice(0, 4).map((st) => (
              <li key={st.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onToggleSubtask(st.id, !st.done)}
                  className="flex-shrink-0 w-4 h-4 rounded border border-gray-500 flex items-center justify-center hover:bg-gray-600"
                  aria-label={st.done ? 'Desmarcar' : 'Concluir'}
                >
                  {st.done && <span className="text-green-400 text-xs">✓</span>}
                </button>
                <span className={st.done ? 'line-through text-gray-500' : ''}>
                  {st.title}
                </span>
              </li>
            ))}
            {subtasks.length > 4 && (
              <li className="text-gray-500 text-xs">+{subtasks.length - 4} mais</li>
            )}
          </ul>
        </div>
      )}

      {showSubtaskInput ? (
        <div className="flex gap-1 mb-2">
          <input
            type="text"
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newSubtaskTitle.trim()) {
                onAddSubtask(task.id, newSubtaskTitle.trim())
                setNewSubtaskTitle('')
                setShowSubtaskInput(false)
              }
              if (e.key === 'Escape') setShowSubtaskInput(false)
            }}
            placeholder="Nova subtarefa..."
            className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white placeholder-gray-400"
            autoFocus
          />
          <button
            type="button"
            onClick={() => {
              if (newSubtaskTitle.trim()) {
                onAddSubtask(task.id, newSubtaskTitle.trim())
                setNewSubtaskTitle('')
                setShowSubtaskInput(false)
              }
            }}
            className="px-2 py-1 bg-blue-600 rounded text-sm"
          >
            +
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowSubtaskInput(true)}
          className="text-xs text-gray-400 hover:text-gray-300 mb-2"
        >
          + Adicionar subtarefa
        </button>
      )}

      <div className="flex flex-wrap gap-2 text-sm">
        {isDoingColumn && onStartFocus && (
          <button
            type="button"
            onClick={() => onStartFocus(task)}
            className="px-3 py-1 bg-emerald-600 rounded hover:bg-emerald-700"
            aria-label={`Iniciar foco: ${task.title}`}
          >
            Iniciar foco
          </button>
        )}
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700"
          aria-label={`Editar tarefa: ${task.title}`}
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => onDelete(task)}
          className="px-3 py-1 bg-red-600 rounded hover:bg-red-700"
          aria-label={`Excluir tarefa: ${task.title}`}
        >
          Excluir
        </button>
      </div>
    </div>
  )
}
