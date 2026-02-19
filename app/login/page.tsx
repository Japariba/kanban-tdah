'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabaseClient'
import toast, { Toaster } from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const supabase = getSupabaseClient()

  async function handleLogin() {
    if (!supabase) {
      toast.error('Aplicação não configurada. Contate o suporte.')
      return
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast.error('Erro no login. Verifique email e senha.')
      return
    }

    toast.success('Login realizado!')
    router.push('/dashboard')
  }

  async function handleSignup() {
    if (!supabase) {
      toast.error('Aplicação não configurada. Contate o suporte.')
      return
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      toast.error('Erro ao cadastrar. Tente outro email.')
      return
    }

    toast.success('Conta criada! Faça login.')
  }

  if (!supabase) {
    return (
      <main className="h-screen flex items-center justify-center bg-gray-950 text-white">
        <p>Configuração indisponível. Verifique as variáveis de ambiente.</p>
      </main>
    )
  }

  return (
    <main className="h-screen flex items-center justify-center bg-gray-950">
      <Toaster position="top-center" />
      <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-xl w-80">
        <h1 className="text-xl font-bold mb-4 text-white">
          Login
        </h1>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleLogin()
          }}
        >
          <label htmlFor="login-email" className="block text-sm text-gray-300 mb-1">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            className="border border-gray-700 bg-gray-800 p-2 rounded w-full mb-3 text-white placeholder-gray-400"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label htmlFor="login-password" className="block text-sm text-gray-300 mb-1">
            Senha
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            className="border border-gray-700 bg-gray-800 p-2 rounded w-full mb-4 text-white placeholder-gray-400"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg mb-2 font-medium transition"
          >
            Entrar
          </button>
        </form>

        <button
          type="button"
          onClick={handleSignup}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg font-medium transition"
        >
          Criar conta
        </button>
      </div>
    </main>
  )
}
