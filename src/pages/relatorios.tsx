// src/pages/relatorios.tsx
import { useState, useEffect, useRef } from 'react'
import { supabaseClient } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

interface Lancamento {
  id: string
  data: string
  valor: number
  forma_pag: string
  origem: string
  descricao?: string
}

export default function RelatoriosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [inicio, setInicio] = useState<string>('')
  const [fim, setFim] = useState<string>('')
  const [formas, setFormas] = useState<string[]>([])
  const [origens, setOrigens] = useState<string[]>([])
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const chartRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const checkSession = async () => {
      // Altere para usar getSession() em vez de session()
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
        // Sem sessão ativa, redireciona ao login
        router.replace('/login')
      } else {
        // Sessão válida → libera conteúdo
        setLoading(false)
      }
    }

    checkSession()
  }, [router])

  const filtrarDados = async () => {
    setErrorMsg(null)

    // Em vez de supabaseClient.auth.session(), use getSession()
    const {
      data: { session },
      error: sessionError
    } = await supabaseClient.auth.getSession()

    if (sessionError || !session) {
      setErrorMsg('Sessão inválida.')
      return
    }

    // Construir query string
    const params = new URLSearchParams()
    if (inicio) params.append('inicio', inicio)
    if (fim) params.append('fim', fim)
    if (formas.length) params.append('formas', formas.join(','))
    if (origens.length) params.append('origens', origens.join(','))

    const response = await fetch(`/api/lancamentos/query?${params.toString()}`, {
      method: 'GET',
      headers: {
        // Send token no header
        Authorization: `Bearer ${session.access_token}`
      }
    })
    const data = await response.json()
    if (!response.ok) {
      setErrorMsg(data.error || 'Erro ao buscar dados')
      return
    }

    setLancamentos(data.lancamentos || [])
    desenharGrafico(data.lancamentos || [])
  }

  const desenharGrafico = (dados: Lancamento[]) => {
    if (!chartRef.current) return

    // Agrupar soma por forma_pag
    const resumo: Record<string, number> = {}
    dados.forEach((l) => {
      if (!resumo[l.forma_pag]) resumo[l.forma_pag] = 0
      resumo[l.forma_pag] += l.valor
    })

    const labels = Object.keys(resumo)
    const values = Object.values(resumo)

    new Chart(chartRef.current, {
      type: 'pie',
      data: {
        labels,
        datasets: [
          {
            label: 'Distribuição por Forma de Pagamento',
            data: values,
            backgroundColor: [
              '#10B981',
              '#3B82F6',
              '#F59E0B',
              '#EF4444',
              '#6366F1'
            ]
          }
        ]
      },
      options: {
        responsive: true
      }
    })
  }

  if (loading) {
    return <p>Carregando...</p>
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow-md">
      <h1 className="text-2xl font-bold mb-4">Relatórios</h1>

      {errorMsg && <p className="text-red-500 mb-3">{errorMsg}</p>}

      {/* Filtros */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-gray-700">Data Início</span>
          <input
            type="date"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            className="mt-1 block w-full border rounded px-2 py-1"
          />
        </label>
        <label className="block">
          <span className="text-gray-700">Data Fim</span>
          <input
            type="date"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
            className="mt-1 block w-full border rounded px-2 py-1"
          />
        </label>
        <label className="block">
          <span className="text-gray-700">Formas de Pagamento</span>
          <select
            multiple
            value={formas}
            onChange={(e) => {
              const opts = Array.from(e.target.selectedOptions, (opt) => opt.value)
              setFormas(opts)
            }}
            className="mt-1 block w-full border rounded px-2 py-1"
          >
            <option value="Cartão">Cartão</option>
            <option value="Pix">Pix</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Boleto">Boleto</option>
          </select>
        </label>
        <label className="block">
          <span className="text-gray-700">Origens</span>
          <select
            multiple
            value={origens}
            onChange={(e) => {
              const opts = Array.from(e.target.selectedOptions, (opt) => opt.value)
              setOrigens(opts)
            }}
            className="mt-1 block w-full border rounded px-2 py-1"
          >
            <option value="Loja">Loja</option>
            <option value="Fábrica">Fábrica</option>
          </select>
        </label>
      </div>

      <button
        onClick={filtrarDados}
        className="mb-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Filtrar
      </button>

      {/* Gráfico (canvas) */}
      <div className="mb-6">
        <canvas ref={chartRef} />
      </div>

      {/* Tabela simples de resultados */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 border">Data</th>
              <th className="py-2 px-4 border">Valor</th>
              <th className="py-2 px-4 border">Forma</th>
              <th className="py-2 px-4 border">Origem</th>
              <th className="py-2 px-4 border">Descrição</th>
            </tr>
          </thead>
          <tbody>
            {lancamentos.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">
                  Nenhum resultado
                </td>
              </tr>
            ) : (
              lancamentos.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">
                    {new Date(l.data).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-4 border">R$ {l.valor.toFixed(2)}</td>
                  <td className="py-2 px-4 border">{l.forma_pag}</td>
                  <td className="py-2 px-4 border">{l.origem}</td>
                  <td className="py-2 px-4 border">{l.descricao || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
