// src/pages/orcamento.tsx
import { useState, useEffect } from 'react'
import { supabaseClient } from '../lib/supabaseClient'
import { useRouter } from 'next/router'

export default function OrcamentoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      // Obtém a sessão atual de forma assíncrona
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
        // Se não houver sessão, redireciona ao login
        router.replace('/login')
      } else {
        // Sessão existe, libera a tela
        setLoading(false)
      }
    }

    checkSession()
  }, [router])

  if (loading) {
    return <p>Carregando...</p>
  }

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded shadow-md">
      <h1 className="text-2xl font-bold mb-4">Orçamentos (Em Breve)</h1>
      <p className="text-gray-600">
        Nesta tela, futuramente teremos a lista de produtos cadastrados e a opção de gerar cotações.
      </p>
    </div>
  )
}
