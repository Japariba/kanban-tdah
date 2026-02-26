'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabaseClient'
import toast, { Toaster } from 'react-hot-toast'

type WeeklyReport = {
  id: string
  user_id: string
  week_start_date: string
  total_focus_minutes: number
  longest_task_title: string | null
  longest_task_minutes: number | null
  estimation_precision_percent: number | null
  created_at: string
}

export default function ReportPage() {
  const [reports, setReports] = useState<WeeklyReport[]>([])
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
      .from('weekly_reports')
      .select('*')
      .eq('user_id', userId)
      .order('week_start_date', { ascending: false })
      .limit(10)
      .then(({ data, error }) => {
        if (error) {
          toast.error('Erro ao carregar relatórios')
          return
        }
        setReports((data as WeeklyReport[]) ?? [])
      })
  }, [authChecked, userId, supabase, router])

  if (!supabase) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
        <p>Configuração indisponível.</p>
      </main>
    )
  }

  function formatWeekRange(weekStart: string) {
    const start = new Date(weekStart)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    return `${start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Toaster position="top-right" />
      <header className="border-b border-gray-800 bg-gray-900 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">Relatório de Conquistas (Dopamina Semanal)</h1>
        <div className="flex gap-2">
          <Link
            href="/history"
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Histórico
          </Link>
          <Link
            href="/dashboard"
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Voltar ao Kanban
          </Link>
        </div>
      </header>

      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <p className="text-gray-400 text-sm">
          Resumo semanal para você ver que fez mais do que imagina. Atualizado todo domingo à noite.
        </p>

        {reports.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-center text-gray-400">
            <p>Nenhum relatório semanal ainda.</p>
            <p className="text-sm mt-2">
              Use o timer de foco e conclua tarefas; o primeiro relatório aparece após o próximo domingo.
            </p>
          </div>
        ) : (
          <ul className="space-y-6">
            {reports.map((r) => (
              <li
                key={r.id}
                className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-4"
              >
                <h2 className="font-semibold text-white">
                  Semana de {formatWeekRange(r.week_start_date)}
                </h2>

                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-gray-700">
                    <span className="text-gray-400">Total de minutos de hiperfoco</span>
                    <span className="text-emerald-400 font-medium">{r.total_focus_minutes} min</span>
                  </div>

                  {r.longest_task_title != null && r.longest_task_minutes != null && (
                    <div className="flex justify-between items-start gap-2 py-2 border-b border-gray-700">
                      <span className="text-gray-400">Tarefa mais longa concluída</span>
                      <span className="text-right">
                        <span className="text-white font-medium">{r.longest_task_title}</span>
                        <span className="text-emerald-400 ml-2">({r.longest_task_minutes} min)</span>
                      </span>
                    </div>
                  )}

                  {r.estimation_precision_percent != null && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-400">Sua precisão de estimativa esta semana</span>
                      <span className="text-amber-400 font-medium">{r.estimation_precision_percent}%</span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
