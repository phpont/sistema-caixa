// pages/api/push/send.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import jwt from 'jsonwebtoken'
import webPush from 'web-push'

/**
 * Espera receber no body:
 * {
 *   lancamentoId: string
 * }
 * Ou, como neste exemplo, poderia ser todo o objeto do lançamento:
 * {
 *   userId: string,
 *   lancamento: {
 *     id: string,
 *     data: string,
 *     valor: number,
 *     forma_pag: string,
 *     origem: string,
 *     descricao: string
 *   }
 * }
 */

type PushPayload = {
  title: string
  body: string
}

type Data = {
  success?: boolean
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
  let payloadJwt: any
  try {
    payloadJwt = jwt.decode(token)
  } catch {
    return res.status(401).json({ error: 'Token inválido' })
  }

  const userId: string = payloadJwt.sub
  const { lancamento } = req.body as {
    lancamento: {
      id: string
      data: string
      valor: number
      forma_pag: string
      origem: string
      descricao?: string
    }
  }

  // Busca todas as assinaturas desse usuário
  const { data: subscriptions, error: subsError } = await supabaseAdmin
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)

  if (subsError) {
    return res.status(400).json({ error: subsError.message })
  }

  // Configurações do VAPID
  webPush.setVapidDetails(
    'mailto:suporte@minhaempresa.com.br',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  // Para cada assinatura, verificar se alguma regra corresponde
  for (const sub of subscriptions!) {
    const regras: Array<any> = sub.regras || []

    // Exemplo simples: disparar se valor >= algum valor definido nas regras
    const shouldNotify = regras.some((rule) => {
      if (rule.tipo === 'valor') {
        const operador = rule.operador as string
        const regraValor = Number(rule.valor)
        switch (operador) {
          case '>=':
            return lancamento.valor >= regraValor
          case '<=':
            return lancamento.valor <= regraValor
          case '>':
            return lancamento.valor > regraValor
          case '<':
            return lancamento.valor < regraValor
          case '==':
            return lancamento.valor === regraValor
          default:
            return false
        }
      } else if (rule.tipo === 'formaPag') {
        return lancamento.forma_pag === rule.valor
      }
      // Adicione outros tipos de regra conforme necessário
      return false
    })

    if (!shouldNotify) continue

    const payload: PushPayload = {
      title: 'Nova venda cadastrada',
      body: `Venda de R$ ${lancamento.valor} via ${lancamento.forma_pag}`
    }

    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth_key
          }
        },
        JSON.stringify(payload)
      )
    } catch (err) {
      console.error(
        `Falha ao enviar notificação para device ${sub.device_id}: `,
        err
      )
    }
  }

  return res.status(200).json({ success: true })
}
