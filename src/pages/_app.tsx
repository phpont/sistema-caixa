// src/pages/_app.tsx
import type { AppProps } from 'next/app'
import Layout from '../components/layout'
import '../styles/globals.css'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  )
}

export default MyApp
