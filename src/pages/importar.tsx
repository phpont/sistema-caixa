// src/pages/importar.tsx
import { useState, useEffect, ChangeEvent } from 'react'
import { supabaseClient } from '../lib/supabaseClient'
import { useRouter } from 'next/router'

export default function ImportarPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const checkSession = async () => {
      // Obter a sessão atual de forma assíncrona
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
        // Sessão válida → desbloqueia a página
        setLoading(false)
      }
    }

    checkSession()
  }, [router])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setMessage('Selecione um arquivo XLSX antes de enviar.')
      return
    }

    setMessage(null)

    // Obter sessão atual para pegar o token
    const {
      data: { session },
      error: sessionError
    } = await supabaseClient.auth.getSession()

    if (sessionError || !session) {
      setMessage('Sessão inválida. Faça login novamente.')
      return
    }

    const userId = session.user?.id
    const token = session.access_token

    // 1) Fazer upload do arquivo para o bucket 'imports'
    const fileExt = file.name.split('.').pop()
    const fileName = `imports/${userId}/${Date.now()}.${fileExt}`
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('imports')
      .upload(fileName, file)

    if (uploadError) {
      setMessage('Falha ao enviar arquivo: ' + uploadError.message)
      return
    }

    // 2) Chamar a rota que processa o XLSX, passando o token no header
    const response = await fetch('/api/lancamentos/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ path: fileName })
    })

    const result = await response.json()
    if (!response.ok) {
      setMessage('Erro ao importar: ' + (result.error || 'Erro desconhecido'))
      return
    }

    setMessage(`Importação concluída: ${result.importedCount} linhas adicionadas.`)
  }

  if (loading) {
    return <p>Carregando...</p>
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow-md">
      <h1 className="text-2xl font-bold mb-4">Importar XLSX</h1>

      {message && (
        <p className="mb-4 text-gray-700">{message}</p>
      )}

      <input
        type="file"
        accept=".xlsx"
        onChange={handleFileChange}
        className="mb-4"
      />

      <button
        onClick={handleUpload}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Enviar e Importar
      </button>
    </div>
  )
}
