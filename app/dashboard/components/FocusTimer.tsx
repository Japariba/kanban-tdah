'use client'

import { useEffect, useState, useRef } from 'react'
import type { Task } from '@/lib/types'

const POMODORO_MINUTES = 25

type FocusTimerProps = {
  task: Task
  onClose: () => void
  onComplete: (taskId: string, durationMinutes: number) => Promise<void>
}

export default function FocusTimer({ task, onClose, onComplete }: FocusTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(POMODORO_MINUTES * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [ended, setEnded] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!isRunning) return
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setEnded(true)
          setIsRunning(false)
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YUtvT18=')
            audio.volume = 0.5
            audio.play().catch(() => {})
          } catch {
            // fallback: no sound
          }
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Foco concluído!', { body: `${task.title}` })
          }
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, task.title])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60

  async function handleComplete() {
    const duration = POMODORO_MINUTES - Math.ceil(secondsLeft / 60)
    await onComplete(task.id, duration > 0 ? duration : POMODORO_MINUTES)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-20"
      role="dialog"
      aria-modal="true"
      aria-labelledby="focus-timer-title"
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-xl">
        <h2 id="focus-timer-title" className="text-lg font-semibold mb-1">
          Foco: {task.title}
        </h2>
        <p className="text-gray-400 text-sm mb-6">Pomodoro (25 min)</p>

        {!ended ? (
          <>
            <div className="text-5xl font-mono font-bold text-center mb-6 tabular-nums">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => setIsRunning(!isRunning)}
                className="px-6 py-3 rounded-lg font-medium bg-emerald-600 hover:bg-emerald-700"
              >
                {isRunning ? 'Pausar' : 'Iniciar'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-lg font-medium bg-gray-700 hover:bg-gray-600"
              >
                Sair
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-center text-emerald-400 font-medium mb-4">
              Tempo de foco concluído!
            </p>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={handleComplete}
                className="px-6 py-3 rounded-lg font-medium bg-emerald-600 hover:bg-emerald-700"
              >
                Registrar e fechar
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-lg font-medium bg-gray-700 hover:bg-gray-600"
              >
                Fechar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
