// pages/api/lancamentos/query.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import jwt from 'jsonwebtoken'

type Data = {
  lancamentos?: Array<Record<string, any>>
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'GET') {
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
  } catch {
    return res.status(401).json({ error: 'Token inválido' })
  }

  const userId: string = payload.sub

  // Filtros via query params:
  // ?inicio=2025-06-01&fim=2025-06-30&formas=Pix,Cartão&origens=Loja,Fábrica
  const { inicio, fim, formas, origens } = req.query as {
    inicio?: string
    fim?: string
    formas?: string
    origens?: string
  }

  let query = supabaseAdmin
    .from('lancamentos')
    .select('*')
    .eq('user_id', userId)

  if (inicio) {
    query = query.gte('data', inicio)
  }
  if (fim) {
    query = query.lte('data', fim)
  }
  if (formas) {
    const arrFormas = (formas as string).split(',')
    query = query.in('forma_pag', arrFormas)
  }
  if (origens) {
    const arrOrigens = (origens as string).split(',')
    query = query.in('origem', arrOrigens)
  }

  const { data, error } = await query.order('data', { ascending: true })

  if (error) {
    return res.status(400).json({ error: error.message })
  }
  return res.status(200).json({ lancamentos: data as Array<Record<string, any>> })
}
