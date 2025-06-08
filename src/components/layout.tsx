// src/components/Layout.tsx
import React, { ReactNode } from 'react'
import Link from 'next/link'

interface LayoutProps {
  children: ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-green-600 text-white px-4 py-3 shadow-md flex items-center justify-between">
        {/* Logo/Marca */}
        <div className="text-lg font-bold">
          <Link href="/" className="hover:underline">
            Sistema de Caixa
          </Link>
        </div>

        {/* Links de navegação */}
        <ul className="flex space-x-4">
          <li>
            <Link href="/dashboard" className="hover:underline">
              Dashboard
            </Link>
          </li>
          <li>
            <Link href="/novo-lancamento" className="hover:underline">
              Novo Lançamento
            </Link>
          </li>
          <li>
            <Link href="/importar" className="hover:underline">
              Importar XLSX
            </Link>
          </li>
          <li>
            <Link href="/relatorios" className="hover:underline">
              Relatórios
            </Link>
          </li>
          <li>
            <Link href="/configuracoes" className="hover:underline">
              Configurações
            </Link>
          </li>
          <li>
            <Link href="/orcamento" className="hover:underline">
              Orçamento
            </Link>
          </li>
        </ul>

        {/* Botão de logout */}
        <div>
          <Link href="/login" className="bg-red-500 px-3 py-1 rounded hover:bg-red-600">
            Sair
          </Link>
        </div>
      </nav>

      {/* Conteúdo principal */}
      <main className="flex-1 bg-gray-50 p-4">{children}</main>

      {/* Footer simples (opcional) */}
      <footer className="bg-gray-200 text-gray-700 text-center py-2">
        © {new Date().getFullYear()} Minha Empresa – Todos os direitos reservados
      </footer>
    </div>
  )
}

export default Layout
