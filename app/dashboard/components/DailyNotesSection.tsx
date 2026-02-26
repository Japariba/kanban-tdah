'use client'

import { useEffect, useState, useRef } from 'react'

type DailyNotesSectionProps = {
  userId: string
  getSupabase: () => ReturnType<typeof import('@/lib/supabaseClient').getSupabaseClient>
  onConvertToTask?: (title: string) => void
}

export default function DailyNotesSection({ userId, getSupabase, onConvertToTask }: DailyNotesSectionProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  function updateSelection() {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const text = content.slice(start, end).trim()
    setSelectedText(text)
  }

  function handleConvertToTask() {
    if (!selectedText || !onConvertToTask) return
    onConvertToTask(selectedText)
    setSelectedText('')
    textareaRef.current?.focus()
  }

  if (loading) return null

  return (
    <section className="mb-6">
      <h3 className="text-sm font-medium text-gray-400 mb-2">Notas rápidas do dia (brain dump)</h3>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={save}
        onMouseUp={updateSelection}
        onKeyUp={updateSelection}
        placeholder="Despeje aqui pensamentos, lembretes, ideias... Selecione um trecho e use o botão abaixo para virar tarefa no Backlog."
        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 resize-y min-h-[80px] text-sm"
        rows={3}
      />
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {saving && <span className="text-xs text-gray-500">Salvando...</span>}
        {onConvertToTask && selectedText.length > 0 && (
          <button
            type="button"
            onClick={handleConvertToTask}
            className="text-sm px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            Criar tarefa no Backlog: &quot;{selectedText.slice(0, 40)}{selectedText.length > 40 ? '…' : ''}&quot;
          </button>
        )}
      </div>
    </section>
  )
}
