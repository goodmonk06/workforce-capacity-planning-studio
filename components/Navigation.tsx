'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/teams', label: 'Teams' },
    { href: '/demand', label: 'Demand' },
    { href: '/simulations', label: 'Simulations' },
  ]

  return (
    <nav style={{
      backgroundColor: '#1a1a1a',
      padding: '1rem 2rem',
      marginBottom: '2rem',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
      }}>
        <h2 style={{
          color: '#fff',
          margin: 0,
          fontSize: '1.2rem',
          fontWeight: 600,
        }}>
          Workforce Planning
        </h2>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                color: pathname === item.href ? '#4da6ff' : '#ccc',
                textDecoration: 'none',
                fontWeight: pathname === item.href ? 600 : 400,
                transition: 'color 0.2s',
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
