import type { Metadata } from 'next'
import { Inter, DM_Mono, Syne } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
})

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Precifica3D — Calculadora de Precificação para Impressão 3D',
  description:
    'Calcule o preço ideal para seus produtos de impressão 3D nos principais marketplaces brasileiros: Mercado Livre, Shopee e TikTok Shop.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${dmMono.variable} ${syne.variable}`}>
      <body className="min-h-screen bg-[#080810] text-[#e8e8f0] antialiased">
        {children}
      </body>
    </html>
  )
}
