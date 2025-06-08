// src/pages/signup.tsx (v2)
import { useState } from 'react'
import { supabaseClient } from '../lib/supabaseClient'
import { useRouter } from 'next/router'

export default function SignupPage() {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const router = useRouter()

  const handleSignup = async () => {
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!email || !password) {
      setErrorMsg('Preencha e-mail e senha.')
      return
    }

    const regex = /^[a-z0-9._%+-]+@minhaempresa\.com\.br$/i
    if (!regex.test(email)) {
      setErrorMsg('O e-mail precisa ser do domínio @minhaempresa.com.br')
      return
    }

    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
      }
    })

    if (error) {
      setErrorMsg(error.message)
      return
    }

    if (data.user) {
      setSuccessMsg(
        'Cadastro realizado! Verifique seu e-mail para confirmar a conta.'
      )
      // Opcional: redirecionar após alguns segundos
      // setTimeout(() => router.push('/login'), 3000)
    } else {
      setErrorMsg('Falha inesperada: usuário não retornado.')
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded shadow-md p-6">
      <h1 className="text-2xl font-bold mb-4">Cadastro</h1>
      {errorMsg && <p className="text-red-500 mb-3">{errorMsg}</p>}
      {successMsg && <p className="text-green-600 mb-3">{successMsg}</p>}
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
        onClick={handleSignup}
        className="mt-4 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
      >
        Cadastrar
      </button>
      <p className="mt-4 text-sm text-center">
        Já tem conta?{' '}
        <a
          className="text-blue-600 hover:underline cursor-pointer"
          onClick={() => router.push('/login')}
        >
          Fazer login
        </a>
      </p>
    </div>
  )
}
