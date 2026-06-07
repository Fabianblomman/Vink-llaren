'use client'

import { useEffect, useState } from 'react'
import PortfolioTable from '@/components/PortfolioTable'
import PortfolioReview from '@/components/PortfolioReview'
import {
  DEFAULT_POSITIONS,
  enrichPositions,
  portfolioSummary,
  type Position,
  type PositionWithPrice,
} from '@/lib/portfolio'

interface PortfolioAnalysis {
  diversificationScore: number
  concentrationRisks: string[]
  recommendations: string[]
  summary: string
}

export default function PortfolioPage() {
  const [raw, setRaw] = useState<Position[]>([])
  const [positions, setPositions] = useState<PositionWithPrice[]>([])
  const [ticker, setTicker] = useState('')
  const [shares, setShares] = useState('')
  const [avgPrice, setAvgPrice] = useState('')
  const [error, setError] = useState('')

  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('portfolio-positions')
    const loaded: Position[] = stored ? JSON.parse(stored) : DEFAULT_POSITIONS
    setRaw(loaded)
    setPositions(enrichPositions(loaded))
  }, [])

  function save(next: Position[]) {
    localStorage.setItem('portfolio-positions', JSON.stringify(next))
    setRaw(next)
    setPositions(enrichPositions(next))
  }

  function addPosition() {
    setError('')
    const t = ticker.trim().toUpperCase()
    const s = parseFloat(shares)
    const p = parseFloat(avgPrice)
    if (!t) return setError('Ticker is required')
    if (isNaN(s) || s <= 0) return setError('Shares must be a positive number')
    if (isNaN(p) || p <= 0) return setError('Price must be a positive number')

    const next: Position[] = [
      ...raw,
      { id: Date.now().toString(), ticker: t, shares: s, avgBuyPrice: p },
    ]
    save(next)
    setTicker('')
    setShares('')
    setAvgPrice('')
  }

  function removePosition(id: string) {
    save(raw.filter((p) => p.id !== id))
    setAnalysis(null)
  }

  async function runPortfolioAnalysis() {
    setAiLoading(true)
    setAiError(null)
    try {
      const res = await fetch('/api/analyze-portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positions }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setAnalysis(data)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setAiLoading(false)
    }
  }

  const summary = portfolioSummary(positions)

  function fmt(n: number, dec = 2) {
    return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="font-sans font-bold text-3xl tracking-tight" style={{ color: '#e2e2f0' }}>
          Portfolio Manager
        </h1>
        <p className="font-mono text-sm mt-1" style={{ color: '#4a4a6a' }}>
          // track positions & get AI analysis
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Value', val: `$${fmt(summary.totalValue, 0)}` },
          {
            label: 'Total Return',
            val: `${summary.totalReturn >= 0 ? '+' : ''}$${fmt(Math.abs(summary.totalReturn), 0)}`,
            pct: `${summary.totalReturnPct >= 0 ? '+' : ''}${fmt(summary.totalReturnPct)}%`,
            pos: summary.totalReturn >= 0,
          },
          {
            label: 'Day Change',
            val: `${summary.dayChange >= 0 ? '+' : ''}$${fmt(Math.abs(summary.dayChange), 0)}`,
            pct: `${summary.dayChangePct >= 0 ? '+' : ''}${fmt(summary.dayChangePct)}%`,
            pos: summary.dayChange >= 0,
          },
          { label: 'Positions', val: String(positions.length) },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-lg px-4 py-3"
            style={{ background: '#0f0f17', border: '1px solid #1e1e2e' }}
          >
            <div className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: '#4a4a6a' }}>
              {c.label}
            </div>
            <div className="font-mono font-semibold text-lg" style={{ color: '#e2e2f0' }}>
              {c.val}
            </div>
            {'pct' in c && (
              <div className="font-mono text-xs" style={{ color: c.pos ? '#00d4a0' : '#ff4d6d' }}>
                {c.pct}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add position form */}
      <div
        className="rounded-lg p-5"
        style={{ background: '#0f0f17', border: '1px solid #1e1e2e' }}
      >
        <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: '#4a4a6a' }}>
          Add Position
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          {[
            { placeholder: 'Ticker (e.g. AAPL)', value: ticker, setter: setTicker, width: 'w-36' },
            { placeholder: 'Shares', value: shares, setter: setShares, width: 'w-28', type: 'number' },
            { placeholder: 'Avg Buy Price ($)', value: avgPrice, setter: setAvgPrice, width: 'w-40', type: 'number' },
          ].map((f) => (
            <input
              key={f.placeholder}
              type={f.type ?? 'text'}
              placeholder={f.placeholder}
              value={f.value}
              onChange={(e) => f.setter(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addPosition()}
              className={`${f.width} px-3 py-2 rounded font-mono text-sm outline-none transition-colors`}
              style={{
                background: '#13131e',
                border: '1px solid #1e1e2e',
                color: '#e2e2f0',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#f5a623')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#1e1e2e')}
            />
          ))}
          <button
            onClick={addPosition}
            className="px-4 py-2 rounded font-mono text-sm font-semibold transition-all"
            style={{
              background: 'rgba(245,166,35,0.15)',
              color: '#f5a623',
              border: '1px solid rgba(245,166,35,0.3)',
            }}
          >
            + Add
          </button>
        </div>
        {error && (
          <div className="mt-2 font-mono text-xs" style={{ color: '#ff4d6d' }}>
            {error}
          </div>
        )}
      </div>

      {/* Table */}
      <PortfolioTable positions={positions} onRemove={removePosition} />

      {/* AI Review */}
      <PortfolioReview
        analysis={analysis}
        loading={aiLoading}
        error={aiError}
        onAnalyze={runPortfolioAnalysis}
      />
    </div>
  )
}
