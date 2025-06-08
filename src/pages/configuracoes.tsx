// src/pages/configuracoes.tsx
import { useState, useEffect } from 'react'
import { supabaseClient } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
import { v4 as uuidv4 } from 'uuid'

interface Regra {
  id: string
  tipo: 'valor' | 'formaPag'
  operador?: '>=' | '<=' | '==' | '>' | '<'
  valor: number | string
}

export default function ConfiguracoesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [regras, setRegras] = useState<Regra[]>([])
  const [newRegraTipo, setNewRegraTipo] = useState<'valor' | 'formaPag'>('valor')
  const [newRegraOperador, setNewRegraOperador] = useState<Regra['operador']>('<=')
  const [newRegraValor, setNewRegraValor] = useState<number | string>('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const checkSessionAndLoad = async () => {
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
        router.replace('/login')
      } else {
        // Carrega as regras só quando a sessão estiver presente
        await carregarRegras(session.access_token)
        setLoading(false)
      }
    }

    checkSessionAndLoad()
  }, [router])

  // Agora o carregarRegras recebe token como parâmetro
  const carregarRegras = async (token: string) => {
    try {
      const response = await fetch('/api/push/getRules', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        console.error('Falha ao buscar regras:', await response.text())
        return
      }

      const data = await response.json()
      setRegras(data.regras || [])
    } catch (err) {
      console.error('Erro durante carregarRegras:', err)
    }
  }

  const adicionarRegra = async () => {
    setErrorMsg(null)

    // Validações básicas
    if (
      newRegraTipo === 'valor' &&
      (newRegraOperador === undefined || newRegraValor === '')
    ) {
      setErrorMsg('Defina corretamente o operador e o valor.')
      return
    }
    if (newRegraTipo === 'formaPag' && (newRegraValor as string).trim() === '') {
      setErrorMsg('Defina corretamente a forma de pagamento.')
      return
    }

    // Monta o objeto Regra
    const regra: Regra = {
      id: uuidv4(),
      tipo: newRegraTipo,
      operador: newRegraTipo === 'valor' ? newRegraOperador : undefined,
      valor: newRegraValor
    }

    // Pegar a sessão atual de novo para obter token
    const {
      data: { session },
      error: sessionError
    } = await supabaseClient.auth.getSession()

    if (sessionError || !session) {
      setErrorMsg('Sessão inválida. Faça login novamente.')
      return
    }
    const token = session.access_token

    // Chama a API para atualizar as regras
    const response = await fetch('/api/push/updateRules', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ regra })
    })

    if (!response.ok) {
      const data = await response.json()
      setErrorMsg(data.error || 'Erro ao adicionar regra.')
      return
    }

    // Se deu certo, adiciona localmente e reseta inputs
    setRegras((prev) => [...prev, regra])
    setNewRegraOperador('<=')
    setNewRegraValor('')
  }

  if (loading) {
    return <p>Carregando...</p>
  }

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded shadow-md">
      <h1 className="text-2xl font-bold mb-4">
        Configurações de Notificação
      </h1>

      {errorMsg && <p className="text-red-500 mb-3">{errorMsg}</p>}

      {/* Formulário para nova regra */}
      <div className="mb-6">
        <label className="block mb-2">
          <span className="text-gray-700">Tipo de Regra</span>
          <select
            value={newRegraTipo}
            onChange={(e) =>
              setNewRegraTipo(e.target.value as 'valor' | 'formaPag')
            }
            className="mt-1 block w-full border rounded px-2 py-1"
          >
            <option value="valor">Valor</option>
            <option value="formaPag">Forma de Pagamento</option>
          </select>
        </label>

        {newRegraTipo === 'valor' ? (
          <>
            <label className="block mb-2">
              <span className="text-gray-700">Operador</span>
              <select
                value={newRegraOperador}
                onChange={(e) =>
                  setNewRegraOperador(e.target.value as Regra['operador'])
                }
                className="mt-1 block w-full border rounded px-2 py-1"
              >
                <option value=">=">&gt;=</option>
                <option value="<=">&lt;=</option>
                <option value=">">&gt;</option>
                <option value="<">&lt;</option>
                <option value="==">==</option>
              </select>
            </label>
            <label className="block mb-2">
              <span className="text-gray-700">Valor (R$)</span>
              <input
                type="number"
                step="0.01"
                value={newRegraValor as number}
                onChange={(e) => setNewRegraValor(Number(e.target.value))}
                className="mt-1 block w-full border rounded px-2 py-1"
                placeholder="0.00"
              />
            </label>
          </>
        ) : (
          <label className="block mb-2">
            <span className="text-gray-700">Forma de Pagamento</span>
            <select
              value={newRegraValor as string}
              onChange={(e) => setNewRegraValor(e.target.value)}
              className="mt-1 block w-full border rounded px-2 py-1"
            >
              <option value="">Selecione</option>
              <option value="Cartão">Cartão</option>
              <option value="Pix">Pix</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Boleto">Boleto</option>
            </select>
          </label>
        )}

        <button
          onClick={adicionarRegra}
          className="mt-3 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Adicionar Regra
        </button>
      </div>

      {/* Lista de regras existentes */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Regras Atuais</h2>
        {regras.length === 0 ? (
          <p className="text-gray-600">Nenhuma regra cadastrada.</p>
        ) : (
          <ul className="space-y-2">
            {regras.map((r) => (
              <li key={r.id} className="border p-3 rounded bg-gray-50">
                {r.tipo === 'valor' ? (
                  <p>
                    Valor {r.operador} R$ {(r.valor as number).toFixed(2)}
                  </p>
                ) : (
                  <p>Venda via {r.valor as string}</p>
                )}
                {/* Botões de editar/excluir podem vir aqui */}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
