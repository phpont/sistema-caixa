// pages/api/push/register.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import jwt from 'jsonwebtoken'

interface SubscriptionInput {
  deviceId: string
  subscription: {
    endpoint: string
    keys: {
      p256dh: string
      auth: string
    }
  }
}

type Data = {
  subscription?: Record<string, any>
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
  } catch {
    return res.status(401).json({ error: 'Token inválido' })
  }

  const userId: string = payload.sub
  const { deviceId, subscription } = req.body as SubscriptionInput
  const { endpoint, keys } = subscription

  const { data, error } = await supabaseAdmin
    .from('push_subscriptions')
    .insert([
      {
        user_id: userId,
        device_id: deviceId,
        endpoint: endpoint,
        p256dh: keys.p256dh,
        auth_key: keys.auth,
        regras: [] // começa sem regras; o front define depois
      }
    ])
    .select('*')
    .single()

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  return res.status(200).json({ subscription: data })
}
