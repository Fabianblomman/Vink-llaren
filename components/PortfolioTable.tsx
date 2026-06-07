'use client'

import type { PositionWithPrice } from '@/lib/portfolio'

interface Props {
  positions: PositionWithPrice[]
  onRemove: (id: string) => void
}

function fmt(n: number, decimals = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function fmtUSD(n: number) {
  return '$' + fmt(Math.abs(n))
}

export default function PortfolioTable({ positions, onRemove }: Props) {
  if (positions.length === 0) {
    return (
      <div
        className="flex items-center justify-center py-16 rounded-lg"
        style={{ background: '#0f0f17', border: '1px solid #1e1e2e' }}
      >
        <span className="font-mono text-sm" style={{ color: '#4a4a6a' }}>
          No positions yet — add a ticker below
        </span>
      </div>
    )
  }

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: '1px solid #1e1e2e' }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: '#0f0f17', borderBottom: '1px solid #1e1e2e' }}>
            {['Ticker', 'Shares', 'Avg Cost', 'Price', 'Value', 'P&L', 'Day Chg', ''].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left font-mono font-medium tracking-wider text-xs uppercase"
                style={{ color: '#4a4a6a' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {positions.map((pos) => {
            const pnlPos = pos.pnl >= 0
            const dayPos = pos.dayChange >= 0
            return (
              <tr
                key={pos.id}
                className="transition-colors duration-150"
                style={{ borderBottom: '1px solid #1e1e2e' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#13131e')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td className="px-4 py-3">
                  <span className="font-mono font-semibold" style={{ color: '#f5a623' }}>
                    {pos.ticker}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono" style={{ color: '#e2e2f0' }}>
                  {fmt(pos.shares, 0)}
                </td>
                <td className="px-4 py-3 font-mono" style={{ color: '#4a4a6a' }}>
                  ${fmt(pos.avgBuyPrice)}
                </td>
                <td className="px-4 py-3 font-mono" style={{ color: '#e2e2f0' }}>
                  ${fmt(pos.currentPrice)}
                </td>
                <td className="px-4 py-3 font-mono" style={{ color: '#e2e2f0' }}>
                  {fmtUSD(pos.value)}
                </td>
                <td className="px-4 py-3">
                  <div className="font-mono" style={{ color: pnlPos ? '#00d4a0' : '#ff4d6d' }}>
                    {pnlPos ? '+' : '-'}{fmtUSD(pos.pnl)}
                  </div>
                  <div className="text-xs font-mono" style={{ color: pnlPos ? '#00d4a0' : '#ff4d6d' }}>
                    {pnlPos ? '+' : ''}{fmt(pos.pnlPercent)}%
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="font-mono text-xs px-2 py-1 rounded"
                    style={{
                      color: dayPos ? '#00d4a0' : '#ff4d6d',
                      background: dayPos ? 'rgba(0,212,160,0.1)' : 'rgba(255,77,109,0.1)',
                    }}
                  >
                    {dayPos ? '+' : ''}{fmt(pos.dayChangePercent)}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onRemove(pos.id)}
                    className="font-mono text-xs px-2 py-1 rounded transition-colors"
                    style={{ color: '#4a4a6a', border: '1px solid #1e1e2e' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = '#ff4d6d'
                      ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#ff4d6d'
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = '#4a4a6a'
                      ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#1e1e2e'
                    }}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
