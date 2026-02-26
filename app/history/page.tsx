'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabaseClient'
import toast, { Toaster } from 'react-hot-toast'

type HistoryTask = {
  id: string
  title: string
  completed_at: string
  priority: string
  estimated_time_minutes?: number | null
}

type FocusTotal = { task_id: string; total_minutes: number }

/** Precisão = 100 - erro percentual (quanto menor |estimado - real|, melhor) */
function precisionScore(estimated: number, actual: number): number {
  const max = Math.max(estimated, actual, 1)
  const error = Math.abs(actual - estimated) / max
  return Math.round(100 * (1 - Math.min(error, 1)))
}

export default function HistoryPage() {
  const [tasks, setTasks] = useState<HistoryTask[]>([])
  const [focusTotals, setFocusTotals] = useState<Record<string, number>>({})
  const [profile, setProfile] = useState<{ plan_tier: string } | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseClient()

  const precisionData = useMemo(() => {
    const withEstimate = tasks.filter(
      (t) => t.estimated_time_minutes != null && focusTotals[t.id] != null && focusTotals[t.id]! > 0
    )
    if (withEstimate.length === 0) return null
    const scores = withEstimate.map((t) =>
      precisionScore(t.estimated_time_minutes!, focusTotals[t.id]!)
    )
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    return { samples: withEstimate.length, avg, scores }
  }, [tasks, focusTotals])

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
      .from('profiles')
      .select('plan_tier')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => setProfile((data as { plan_tier: string } | null) ?? null))

    supabase
      .from('tasks')
      .select('id, title, completed_at, priority, estimated_time_minutes')
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

  const isPro = profile?.plan_tier === 'pro'

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

      <div className="p-6 max-w-3xl mx-auto space-y-8">
        {/* Análise de Precisão de Tempo (estimado vs real) — gate Pro */}
        <section className="relative rounded-xl border border-gray-700 bg-gray-800/80 overflow-hidden">
          <h2 className="text-lg font-semibold text-white mb-3 px-1">Precisão de Tempo</h2>
          <p className="text-sm text-gray-400 mb-4">
            Compare o tempo que você estimou com o tempo real de foco (autoconhecimento).
          </p>
          <div className={!isPro ? 'blur-md select-none pointer-events-none' : ''}>
            {precisionData ? (
              <>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-emerald-400">{precisionData.avg}%</span>
                  <span className="text-gray-500 text-sm">precisão média</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Baseado em {precisionData.samples} tarefa(s) com estimativa e sessões de foco.
                </p>
                <div className="h-3 bg-gray-700 rounded-full overflow-hidden max-w-xs">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${precisionData.avg}%` }}
                  />
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-sm">
                Conclua tarefas com &quot;Tempo estimado&quot; e use o timer de foco para ver sua precisão aqui.
              </p>
            )}
          </div>
          {!isPro && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80"
              aria-hidden
            >
              <p className="text-white font-medium mb-2 text-center px-4">
                Desbloqueie sua análise de produtividade
              </p>
              <Link
                href="/dashboard#pro"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium"
              >
                Conhecer Plano Pro
              </Link>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">Tarefas concluídas</h2>
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
      </div>
    </main>
  )
}
