'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/analyzer', label: 'Analyzer' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav
      className="flex items-center justify-between px-6 py-4 border-b"
      style={{ background: '#0f0f17', borderColor: '#1e1e2e' }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ background: '#f5a623' }}
        />
        <span
          className="font-sans font-semibold text-lg tracking-wide"
          style={{ color: '#f5a623' }}
        >
          VINK-LLAREN
        </span>
        <span className="text-xs font-mono" style={{ color: '#4a4a6a' }}>
          // PORTFOLIO TERMINAL
        </span>
      </div>

      <div className="flex items-center gap-1">
        {links.map((l) => {
          const active = pathname === l.href
          return (
            <Link
              key={l.href}
              href={l.href}
              className="px-4 py-2 rounded text-sm font-mono transition-all duration-200"
              style={{
                color: active ? '#f5a623' : '#4a4a6a',
                background: active ? 'rgba(245,166,35,0.08)' : 'transparent',
                border: `1px solid ${active ? 'rgba(245,166,35,0.3)' : 'transparent'}`,
              }}
            >
              {l.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
