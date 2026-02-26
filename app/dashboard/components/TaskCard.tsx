'use client'

import { useState } from 'react'
import confetti from 'canvas-confetti'
import type { Task, Subtask } from '@/lib/types'
import { PRIORITY_BORDER_COLORS } from '@/lib/types'

function triggerSubtaskReward() {
  confetti({
    particleCount: 40,
    spread: 60,
    origin: { y: 0.6 },
    colors: ['#10b981', '#34d399', '#fbbf24', '#f59e0b'],
  })
  try {
    const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YUtvT18=')
    audio.volume = 0.4
    audio.play().catch(() => {})
  } catch {
    // ignore
  }
}

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
  const [subtasksExpanded, setSubtasksExpanded] = useState(false)

  return (
    <div
      className={`bg-gray-800 p-4 rounded-xl shadow mb-3 border border-gray-700 border-l-4 ${borderClass}`}
    >
      <div className="font-medium mb-2">{task.title}</div>

      {total > 0 && (
        <div className="mb-2">
          <button
            type="button"
            onClick={() => setSubtasksExpanded((e) => !e)}
            className="w-full flex items-center justify-between text-xs text-gray-400 mb-1 hover:text-gray-300 transition rounded px-1 py-0.5 -mx-1"
            aria-expanded={subtasksExpanded}
            aria-label={subtasksExpanded ? 'Recolher subtarefas' : 'Expandir subtarefas'}
          >
            <span>Subtarefas</span>
            <span className="flex items-center gap-1.5">
              <span>{doneCount}/{total}</span>
              <span
                className={`inline-block transition-transform ${subtasksExpanded ? 'rotate-180' : ''}`}
                aria-hidden
              >
                ▼
              </span>
            </span>
          </button>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          {subtasksExpanded && (
            <ul className="mt-1.5 space-y-1 text-sm text-gray-300 max-h-48 overflow-y-auto">
              {subtasks.map((st) => (
                <li key={st.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const newDone = !st.done
                      onToggleSubtask(st.id, newDone)
                      if (newDone) triggerSubtaskReward()
                    }}
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
            </ul>
          )}
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
