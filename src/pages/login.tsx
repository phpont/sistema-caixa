// src/pages/login.tsx (v2, com bypass em dev)
import { useState, useEffect } from 'react'
import { supabaseClient } from '../lib/supabaseClient'
import { useRouter } from 'next/router'

export default function LoginPage() {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      // ---> PULAR AUTENTICAÇÃO EM DESENVOLVIMENTO
      if (process.env.NODE_ENV === 'development') {
        router.replace('/dashboard')
        return
      }

      // Em produção, checamos a sessão de verdade
      const {
        data: { session },
        error
      } = await supabaseClient.auth.getSession()

      if (error) {
        console.error('Erro ao obter sessão:', error.message)
        return
      }
      if (session) {
        router.replace('/dashboard')
      }
    }
    checkSession()
  }, [router])

  const handleLogin = async () => {
    setErrorMsg(null)

    // Em dev, simulamos login direto (não precisamos credencial)
    if (process.env.NODE_ENV === 'development') {
      router.push('/dashboard')
      return
    }

    if (!email || !password) {
      setErrorMsg('Preencha e-mail e senha.')
      return
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setErrorMsg(error.message)
      return
    }

    if (data.session) {
      // Supabase armazena cookie/sessão automaticamente
      router.push('/dashboard')
    } else {
      setErrorMsg('Falha inesperada: sessão não retornada.')
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded shadow-md p-6">
      <h1 className="text-2xl font-bold mb-4">Login</h1>

      {errorMsg && <p className="text-red-500 mb-3">{errorMsg}</p>}

      <label className="block mb-2">
        <span className="text-gray-700">E-mail</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full border rounded px-2 py-1"
          placeholder="usuario@minhaempresa.com.br"
        />
      </label>

      <label className="block mb-2">
        <span className="text-gray-700">Senha</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full border rounded px-2 py-1"
          placeholder="••••••••"
        />
      </label>

      <button
        onClick={handleLogin}
        className="mt-4 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
      >
        Entrar
      </button>

      <p className="mt-4 text-sm text-center">
        Não tem conta?{' '}
        <span
          className="text-blue-600 hover:underline cursor-pointer"
          onClick={() => router.push('/signup')}
        >
          Cadastre-se aqui
        </span>
      </p>
    </div>
  )
}
