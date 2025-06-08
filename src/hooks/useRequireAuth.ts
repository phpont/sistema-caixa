// src/hooks/useRequireAuth.ts
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { supabaseClient } from '../lib/supabaseClient'

export function useRequireAuth() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const check = async () => {
      // Se rodando em dev, pule a autenticação
      if (process.env.NODE_ENV === 'development') {
        setLoading(false)
        return
      }

      // Senão, valida a sessão normalmente
      const { data: { session }, error } = await supabaseClient.auth.getSession()
      if (error || !session) {
        router.replace('/login')
      } else {
        setLoading(false)
      }
    }

    check()
  }, [router])

  return loading
}
