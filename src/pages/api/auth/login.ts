// pages/api/auth/login.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseClient } from '../../../lib/supabaseClient'

type Data = {
  session?: Record<string, any>
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

  const { data: session, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  // Em produção, aqui você habitualmente colocaria o JWT em um cookie HttpOnly.
  // Para este exemplo, retornamos apenas a session e o front-end pode armazenar no localStorage.
  return res.status(200).json({ session: session as Record<string, any> })
}
