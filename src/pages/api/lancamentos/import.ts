// pages/api/lancamentos/import.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import jwt from 'jsonwebtoken'
import XLSX from 'xlsx'

type Data = {
  importedCount?: number
  errorRows?: Array<{ row: number; reason: string }>
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
  const { path } = req.body as { path: string }

  // Faz download do arquivo .xlsx armazenado no Supabase Storage
  const { data: fileData, error: downloadError } = await supabaseAdmin.storage
    .from('imports')
    .download(path)

  if (downloadError || !fileData) {
    return res.status(400).json({ error: 'Falha ao baixar o arquivo XLSX' })
  }

  // Lê o XLSX como ArrayBuffer
  const buffer = await fileData.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows: Array<Record<string, any>> = XLSX.utils.sheet_to_json(sheet, {
    defval: ''
  })

  const errorRows: Array<{ row: number; reason: string }> = []
  let importedCount = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowIndex = i + 2 // considerar cabeçalho na linha 1

    // Validações básicas
    if (
      !row['Data'] ||
      !row['Valor'] ||
      !row['FormaPag'] ||
      !row['Origem']
    ) {
      errorRows.push({
        row: rowIndex,
        reason: 'Coluna obrigatória ausente'
      })
      continue
    }

    // Exemplo: converter Data para string ISO
    const dataCell = String(row['Data'])
    const valorCell = Number(row['Valor'])
    const formaPagCell = String(row['FormaPag'])
    const origemCell = String(row['Origem'])
    const descricaoCell = row['Descrição'] ? String(row['Descrição']) : ''

    // Insere no banco
    const { error: insertError } = await supabaseAdmin
      .from('lancamentos')
      .insert([
        {
          user_id: userId,
          data: dataCell,
          valor: valorCell,
          forma_pag: formaPagCell,
          origem: origemCell,
          descricao: descricaoCell
        }
      ])

    if (insertError) {
      errorRows.push({
        row: rowIndex,
        reason: insertError.message
      })
    } else {
      importedCount++
    }
  }

  return res.status(200).json({
    importedCount,
    errorRows
  })
}
