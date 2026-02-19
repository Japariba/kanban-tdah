'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabaseClient'

type HomeCtaProps = {
  loggedOutLabel: string
  loggedInLabel?: string
  loggedOutHref?: string
  loggedInHref?: string
  className?: string
}

export default function HomeCta({
  loggedOutLabel,
  loggedInLabel = 'Acessar meu Kanban',
  loggedOutHref = '/login',
  loggedInHref = '/dashboard',
  className = '',
}: HomeCtaProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const client = getSupabaseClient()
    if (!client) {
      setLoading(false)
      return
    }
    client.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
      setLoading(false)
    })
  }, [])

  const href = loading ? loggedOutHref : (isLoggedIn ? loggedInHref : loggedOutHref)
  const label = loading ? loggedOutLabel : (isLoggedIn ? loggedInLabel : loggedOutLabel)

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  )
}
