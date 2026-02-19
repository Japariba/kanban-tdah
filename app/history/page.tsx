'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabaseClient'
import toast, { Toaster } from 'react-hot-toast'

type HistoryTask = {
  id: string
  title: string
  completed_at: string
  priority: string
}

type FocusTotal = { task_id: string; total_minutes: number }

export default function HistoryPage() {
  const [tasks, setTasks] = useState<HistoryTask[]>([])
  const [focusTotals, setFocusTotals] = useState<Record<string, number>>({})
  const [userId, setUserId] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseClient()

  useEffect(() => {
    const client = getSupabaseClient()
    if (!client) {
      setAuthChecked(true)
      return
    }
    client.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
      setAuthChecked(true)
    })
  }, [])

  useEffect(() => {
    if (!authChecked) return
    if (supabase && !userId) {
      router.replace('/login')
      return
    }
    if (!userId || !supabase) return

    supabase
      .from('tasks')
      .select('id, title, completed_at, priority')
      .eq('user_id', userId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (error) {
          toast.error('Erro ao carregar histórico')
          return
        }
        setTasks((data as HistoryTask[]) ?? [])
      })

    supabase
      .from('focus_sessions')
      .select('task_id, duration_minutes')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (!data) return
        const byTask: Record<string, number> = {}
        for (const row of data as { task_id: string; duration_minutes: number }[]) {
          byTask[row.task_id] = (byTask[row.task_id] ?? 0) + row.duration_minutes
        }
        setFocusTotals(byTask)
      })
  }, [authChecked, userId, supabase, router])

  if (!supabase) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
        <p>Configuração indisponível.</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Toaster position="top-right" />
      <header className="border-b border-gray-800 bg-gray-900 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">Histórico de tarefas concluídas</h1>
        <Link
          href="/dashboard"
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          Voltar ao Kanban
        </Link>
      </header>

      <section className="p-6 max-w-3xl mx-auto">
        {tasks.length === 0 ? (
          <p className="text-gray-400">Nenhuma tarefa concluída ainda.</p>
        ) : (
          <ul className="space-y-3">
            {tasks.map((t) => (
              <li
                key={t.id}
                className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex justify-between items-start gap-4"
              >
                <div>
                  <div className="font-medium">{t.title}</div>
                  <div className="text-sm text-gray-400 mt-1">
                    Concluída em{' '}
                    {t.completed_at
                      ? new Date(t.completed_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </div>
                </div>
                {focusTotals[t.id] != null && focusTotals[t.id] > 0 && (
                  <span className="text-sm text-emerald-400 whitespace-nowrap">
                    {focusTotals[t.id]} min foco
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
