'use client'

import { useEffect, useState } from 'react'
import AllocationChart from '@/components/AllocationChart'
import { DEFAULT_POSITIONS, enrichPositions, portfolioSummary, type PositionWithPrice } from '@/lib/portfolio'

function SummaryCard({
  label,
  value,
  sub,
  positive,
}: {
  label: string
  value: string
  sub?: string
  positive?: boolean
}) {
  return (
    <div
      className="rounded-lg p-5"
      style={{ background: '#0f0f17', border: '1px solid #1e1e2e' }}
    >
      <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: '#4a4a6a' }}>
        {label}
      </div>
      <div className="font-mono font-bold text-2xl" style={{ color: '#e2e2f0' }}>
        {value}
      </div>
      {sub && (
        <div
          className="font-mono text-sm mt-1"
          style={{ color: positive === undefined ? '#4a4a6a' : positive ? '#00d4a0' : '#ff4d6d' }}
        >
          {sub}
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const [positions, setPositions] = useState<PositionWithPrice[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('portfolio-positions')
    const raw = stored ? JSON.parse(stored) : DEFAULT_POSITIONS
    setPositions(enrichPositions(raw))
  }, [])

  const summary = portfolioSummary(positions)

  function fmt(n: number, dec = 2) {
    return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-sans font-bold text-3xl tracking-tight" style={{ color: '#e2e2f0' }}>
          Dashboard
        </h1>
        <p className="font-mono text-sm mt-1" style={{ color: '#4a4a6a' }}>
          // real-time portfolio overview
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Value"
          value={`$${fmt(summary.totalValue, 0)}`}
          sub={`${positions.length} positions`}
        />
        <SummaryCard
          label="Day Change"
          value={`${summary.dayChange >= 0 ? '+' : ''}$${fmt(Math.abs(summary.dayChange), 0)}`}
          sub={`${summary.dayChangePct >= 0 ? '+' : ''}${fmt(summary.dayChangePct)}%`}
          positive={summary.dayChange >= 0}
        />
        <SummaryCard
          label="Total Return"
          value={`${summary.totalReturn >= 0 ? '+' : '-'}$${fmt(Math.abs(summary.totalReturn), 0)}`}
          sub={`${summary.totalReturnPct >= 0 ? '+' : ''}${fmt(summary.totalReturnPct)}%`}
          positive={summary.totalReturn >= 0}
        />
        <SummaryCard
          label="Cost Basis"
          value={`$${fmt(summary.totalCost, 0)}`}
          sub="total invested"
        />
      </div>

      {/* Chart + Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AllocationChart positions={positions} />
        </div>

        <div className="space-y-4">
          {/* Best performer */}
          <div
            className="rounded-lg p-5"
            style={{ background: '#0f0f17', border: '1px solid rgba(0,212,160,0.2)' }}
          >
            <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: '#00d4a0' }}>
              ▲ Best Performer
            </div>
            {summary.best ? (
              <>
                <div className="font-mono font-bold text-xl" style={{ color: '#f5a623' }}>
                  {summary.best.ticker}
                </div>
                <div className="font-mono text-lg" style={{ color: '#00d4a0' }}>
                  +{fmt(summary.best.pnlPercent)}%
                </div>
                <div className="font-mono text-sm" style={{ color: '#4a4a6a' }}>
                  +${fmt(summary.best.pnl)}
                </div>
              </>
            ) : (
              <div className="font-mono text-sm" style={{ color: '#4a4a6a' }}>—</div>
            )}
          </div>

          {/* Worst performer */}
          <div
            className="rounded-lg p-5"
            style={{ background: '#0f0f17', border: '1px solid rgba(255,77,109,0.2)' }}
          >
            <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: '#ff4d6d' }}>
              ▼ Worst Performer
            </div>
            {summary.worst ? (
              <>
                <div className="font-mono font-bold text-xl" style={{ color: '#f5a623' }}>
                  {summary.worst.ticker}
                </div>
                <div className="font-mono text-lg" style={{ color: '#ff4d6d' }}>
                  {fmt(summary.worst.pnlPercent)}%
                </div>
                <div className="font-mono text-sm" style={{ color: '#4a4a6a' }}>
                  ${fmt(summary.worst.pnl)}
                </div>
              </>
            ) : (
              <div className="font-mono text-sm" style={{ color: '#4a4a6a' }}>—</div>
            )}
          </div>

          {/* Quick links */}
          <div
            className="rounded-lg p-5 space-y-2"
            style={{ background: '#0f0f17', border: '1px solid #1e1e2e' }}
          >
            <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: '#4a4a6a' }}>
              Quick Actions
            </div>
            <a
              href="/portfolio"
              className="flex items-center gap-2 px-3 py-2 rounded font-mono text-sm transition-colors"
              style={{ color: '#e2e2f0', border: '1px solid #1e1e2e' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = '#f5a623'
                ;(e.currentTarget as HTMLAnchorElement).style.color = '#f5a623'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = '#1e1e2e'
                ;(e.currentTarget as HTMLAnchorElement).style.color = '#e2e2f0'
              }}
            >
              → Manage Portfolio
            </a>
            <a
              href="/analyzer"
              className="flex items-center gap-2 px-3 py-2 rounded font-mono text-sm transition-colors"
              style={{ color: '#e2e2f0', border: '1px solid #1e1e2e' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = '#f5a623'
                ;(e.currentTarget as HTMLAnchorElement).style.color = '#f5a623'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = '#1e1e2e'
                ;(e.currentTarget as HTMLAnchorElement).style.color = '#e2e2f0'
              }}
            >
              → Analyze a Stock
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
