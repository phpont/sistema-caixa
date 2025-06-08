// pages/api/lancamentos/create.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import jwt from 'jsonwebtoken'

interface LancamentoInput {
  data: string
  valor: number
  forma_pag: string
  origem: string
  descricao?: string
}

type Data = {
  lancamento?: Record<string, any>
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ error: 'Não autorizado' })
  }

  const token = authHeader.split(' ')[1]
  let payload: any
  try {
    payload = jwt.decode(token)
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' })
  }

  const userId: string = payload.sub

  const {
    data,
    valor,
    forma_pag,
    origem,
    descricao = ''
  } = req.body as LancamentoInput

  const { data: inserted, error } = await supabaseAdmin
    .from('lancamentos')
    .insert([
      {
        user_id: userId,
        data: data,
        valor: valor,
        forma_pag: forma_pag,
        origem: origem,
        descricao: descricao
      }
    ])
    .select('*')
    .single()

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  // Se desejar: disparar checagem de push notification aqui
  // await triggerPushCheck({ userId, lancamento: inserted })

  return res.status(200).json({ lancamento: inserted })
}
