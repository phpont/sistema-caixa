// pages/api/auth/signup.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseClient } from '../../../lib/supabaseClient'

type Data = {
  user?: Record<string, any>
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const { email, password } = req.body as { email: string; password: string }

  // Verifica domínio do e-mail (exato "@minhaempresa.com.br")
  const regex = /^[a-z0-9._%+-]+@minhaempresa\.com\.br$/i
  if (!regex.test(email)) {
    return res
      .status(400)
      .json({ error: 'E-mail não pertence ao domínio da empresa' })
  }

  const { data: user, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
    }
  })

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  // Opcional: gravar dados extras na tabela "users", se tiver criado uma.
  return res.status(200).json({ user: user as Record<string, any> })
}
