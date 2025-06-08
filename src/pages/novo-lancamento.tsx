// src/pages/novo-lancamento.tsx
import { useState, useEffect } from 'react'
import { supabaseClient } from '../lib/supabaseClient'
import { useRouter } from 'next/router'

interface LancamentoForm {
  data: string
  valor: number
  forma_pag: string
  origem: string
  descricao: string
}

export default function NovoLancamentoPage() {
  const router = useRouter()
  const [lancamento, setLancamento] = useState<LancamentoForm>({
    data: '',
    valor: 0,
    forma_pag: '',
    origem: '',
    descricao: ''
  })
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
        error
      } = await supabaseClient.auth.getSession()

      if (error) {
        console.error(error.message)
        router.replace('/login')
        return
      }
      if (!session) {
        router.replace('/login')
      } else {
        setLoading(false)
      }
    }
    checkSession()
  }, [router])

  const handleSubmit = async () => {
    setErrorMsg(null)
    const {
      data: { session },
      error: sessionError
    } = await supabaseClient.auth.getSession()

    if (sessionError || !session) {
      setErrorMsg('Sessão inválida. Faça login novamente.')
      return
    }

    if (
      !lancamento.data ||
      !lancamento.valor ||
      !lancamento.forma_pag ||
      !lancamento.origem
    ) {
      setErrorMsg('Preencha todos os campos obrigatórios.')
      return
    }

    const response = await fetch('/api/lancamentos/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify(lancamento)
    })

    const data = await response.json()
    if (!response.ok) {
      setErrorMsg(data.error || 'Erro desconhecido ao salvar.')
      return
    }

    router.push('/relatorios')
  }

  if (loading) {
    return <p>Carregando...</p>
  }

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded shadow-md">
      <h1 className="text-2xl font-bold mb-4">Novo Lançamento</h1>
      {errorMsg && <p className="text-red-500 mb-3">{errorMsg}</p>}
      <label className="block mb-2">
        <span className="text-gray-700">Data</span>
        <input
          type="date"
          value={lancamento.data}
          onChange={(e) =>
            setLancamento({ ...lancamento, data: e.target.value })
          }
          className="mt-1 block w-full border rounded px-2 py-1"
        />
      </label>
      <label className="block mb-2">
        <span className="text-gray-700">Valor (R$)</span>
        <input
          type="number"
          step="0.01"
          value={lancamento.valor}
          onChange={(e) =>
            setLancamento({ ...lancamento, valor: Number(e.target.value) })
          }
          className="mt-1 block w-full border rounded px-2 py-1"
          placeholder="0.00"
        />
      </label>
      <label className="block mb-2">
        <span className="text-gray-700">Forma de Pagamento</span>
        <select
          value={lancamento.forma_pag}
          onChange={(e) =>
            setLancamento({ ...lancamento, forma_pag: e.target.value })
          }
          className="mt-1 block w-full border rounded px-2 py-1"
        >
          <option value="">Selecione</option>
          <option value="Cartão">Cartão</option>
          <option value="Pix">Pix</option>
          <option value="Dinheiro">Dinheiro</option>
          <option value="Boleto">Boleto</option>
        </select>
      </label>
      <label className="block mb-2">
        <span className="text-gray-700">Origem</span>
        <select
          value={lancamento.origem}
          onChange={(e) =>
            setLancamento({ ...lancamento, origem: e.target.value })
          }
          className="mt-1 block w-full border rounded px-2 py-1"
        >
          <option value="">Selecione</option>
          <option value="Loja">Loja</option>
          <option value="Fábrica">Fábrica</option>
        </select>
      </label>
      <label className="block mb-4">
        <span className="text-gray-700">Descrição (opcional)</span>
        <textarea
          value={lancamento.descricao}
          onChange={(e) =>
            setLancamento({ ...lancamento, descricao: e.target.value })
          }
          className="mt-1 block w-full border rounded px-2 py-1"
          rows={2}
          placeholder="Ex.: Venda de produto X"
        />
      </label>
      <button
        onClick={handleSubmit}
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
      >
        Salvar Lançamento
      </button>
    </div>
  )
}
