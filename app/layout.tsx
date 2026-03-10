import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Precifica3D — Calculadora de Precificação para Impressão 3D',
  description:
    'Calcule o preço ideal para seus produtos de impressão 3D nos principais marketplaces brasileiros: Mercado Livre, Shopee e TikTok Shop.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-screen bg-dark-bg text-slate-100 antialiased">
        {children}
      </body>
    </html>
  )
}
