// next.config.ts
import { NextConfig } from 'next'
import withPWA from 'next-pwa'

const pwaConfig = {
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Se quiser adicionar configurações adicionais, faça aqui
}

export default withPWA(pwaConfig)(nextConfig)
