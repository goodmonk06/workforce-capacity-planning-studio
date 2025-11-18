import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'Workforce Capacity Planning Studio',
  description: 'Model teams, demand, and simulate capacity planning',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Navigation />
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
