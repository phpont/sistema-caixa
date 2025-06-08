// src/pages/dashboard.tsx
import { useEffect, useState } from 'react'
import { supabaseClient } from '../lib/supabaseClient'
import { useRouter } from 'next/router'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string>('')

  useEffect(() => {
    // Versão assíncrona para pegar a sessão
    const checkSession = async () => {

      if (process.env.NODE_ENV === 'development') {
        router.replace('/dashboard')
        return
      }  
      const {
        data: { session },
        error
      } = await supabaseClient.auth.getSession()

      if (error) {
        console.error('Erro ao obter sessão:', error.message)
        router.replace('/login')
        return
      }

      if (!session) {
        // não está logado → redireciona ao login
        router.replace('/login')
      } else {
        setUserEmail(session.user.email!)
        setLoading(false)
      }
    }

    checkSession()
  }, [router])

  if (loading) {
    return <p>Carregando...</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="mb-6">Bem-vindo(a), {userEmail}!</p>
      {/* Resto do layout... */}
    </div>
  )
}
