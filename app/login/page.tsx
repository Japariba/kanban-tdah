'use client'

console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { getSupabaseClient } from '@/lib/supabaseClient'

const supabase = getSupabaseClient()

import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  async function handleLogin() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert('Erro no login')
      return
    }

    router.push('/')
  }

  async function handleSignup() {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      alert('Erro ao cadastrar')
      return
    }

    alert('Conta criada! Faça login.')
  }

  return (
    <main className="h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded shadow w-80">
        <h1 className="text-xl font-bold mb-4 text-gray-800">
          Login
        </h1>

        <input
          className="border p-2 rounded w-full mb-3 text-gray-800"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="border p-2 rounded w-full mb-4 text-gray-800"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-blue-500 text-white p-2 rounded mb-2"
        >
          Entrar
        </button>

        <button
          onClick={handleSignup}
          className="w-full bg-gray-300 p-2 rounded"
        >
          Criar conta
        </button>
      </div>
    </main>
  )
}
