'use client'

import { useEffect, useState } from 'react'

type DailyNotesSectionProps = {
  userId: string
  getSupabase: () => ReturnType<typeof import('@/lib/supabaseClient').getSupabaseClient>
}

export default function DailyNotesSection({ userId, getSupabase }: DailyNotesSectionProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase) return
    supabase
      .from('daily_notes')
      .select('content')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()
      .then(({ data }) => {
        setContent((data?.content as string) ?? '')
        setLoading(false)
      })
  }, [userId, today, getSupabase])

  function save() {
    const supabase = getSupabase()
    if (!supabase) return
    setSaving(true)
    supabase
      .from('daily_notes')
      .upsert(
        { user_id: userId, date: today, content },
        { onConflict: 'user_id,date' }
      )
      .then(({ error }) => {
        setSaving(false)
        if (error) console.error(error)
      })
  }

  if (loading) return null

  return (
    <section className="mb-6">
      <h3 className="text-sm font-medium text-gray-400 mb-2">Notas rápidas do dia</h3>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={save}
        placeholder="Despeje aqui pensamentos, lembretes, ideias..."
        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 resize-y min-h-[80px] text-sm"
        rows={3}
      />
      {saving && <span className="text-xs text-gray-500">Salvando...</span>}
    </section>
  )
}
