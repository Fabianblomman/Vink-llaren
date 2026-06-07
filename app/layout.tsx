import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Vink-Llaren | Portfolio AI Dashboard',
  description: 'AI-powered portfolio management and stock analysis terminal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="scanlines">
        <Navbar />
        <main className="min-h-screen" style={{ background: '#0a0a0f' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
