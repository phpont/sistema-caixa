// src/pages/index.tsx
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Se quiser redirecionar diretamente ao login (caso não exista sessão),
    // basta checar aqui e fazer router.push('/login').
    // Por enquanto, vamos só redirecionar diretamente ao /login:
    router.replace('/login')
  }, [router])

  return null
}
