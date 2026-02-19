'use client'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let supabase: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient | null {
  if (supabase) return supabase

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    if (typeof window === 'undefined') return null
    console.warn('Supabase: variáveis de ambiente não configuradas.')
    return null
  }

  supabase = createClient(url, key)
  return supabase
}
