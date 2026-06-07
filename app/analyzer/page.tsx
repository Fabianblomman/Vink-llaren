'use client'

import { useState } from 'react'
import StockAnalysisCard from '@/components/StockAnalysisCard'

interface StockAnalysis {
  ticker: string
  companySummary: string
  bullCase: string
  bearCase: string
  keyMetrics: string[]
  sentiment: 'Bullish' | 'Neutral' | 'Bearish'
}

const POPULAR = ['AAPL', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'AMD', 'NFLX', 'COIN']

export default function AnalyzerPage() {
  const [ticker, setTicker] = useState('')
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<StockAnalysis[]>([])

  async function analyze(t?: string) {
    const target = (t ?? ticker).trim().toUpperCase()
    if (!target) return
    setLoading(true)
    setError(null)
    setAnalysis(null)
    try {
      const res = await fetch('/api/analyze-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: target }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setAnalysis(data)
      setHistory((h) => [data, ...h.filter((x) => x.ticker !== data.ticker)].slice(0, 8))
      setTicker('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="font-sans font-bold text-3xl tracking-tight" style={{ color: '#e2e2f0' }}>
          Stock Analyzer
        </h1>
        <p className="font-mono text-sm mt-1" style={{ color: '#4a4a6a' }}>
          // AI-powered equity research terminal
        </p>
      </div>

      {/* Search */}
      <div
        className="rounded-lg p-5"
        style={{ background: '#0f0f17', border: '1px solid #1e1e2e' }}
      >
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm"
              style={{ color: '#4a4a6a' }}
            >
              $
            </span>
            <input
              type="text"
              placeholder="Enter ticker symbol..."
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && analyze()}
              disabled={loading}
              className="w-full pl-7 pr-4 py-2.5 rounded font-mono text-sm outline-none"
              style={{
                background: '#13131e',
                border: '1px solid #1e1e2e',
                color: '#e2e2f0',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#f5a623')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#1e1e2e')}
            />
          </div>
          <button
            onClick={() => analyze()}
            disabled={loading || !ticker.trim()}
            className="px-6 py-2.5 rounded font-mono text-sm font-semibold transition-all disabled:opacity-50"
            style={{
              background: 'rgba(245,166,35,0.15)',
              color: '#f5a623',
              border: '1px solid rgba(245,166,35,0.3)',
            }}
          >
            {loading ? '◌ Analyzing...' : 'Analyze ▶'}
          </button>
        </div>

        {/* Popular tickers */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="font-mono text-xs" style={{ color: '#4a4a6a' }}>
            Quick:
          </span>
          {POPULAR.map((t) => (
            <button
              key={t}
              onClick={() => analyze(t)}
              disabled={loading}
              className="px-2.5 py-1 rounded font-mono text-xs transition-all disabled:opacity-50"
              style={{ color: '#4a4a6a', border: '1px solid #1e1e2e' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = '#f5a623'
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(245,166,35,0.4)'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = '#4a4a6a'
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#1e1e2e'
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Analysis result */}
      <StockAnalysisCard analysis={analysis} loading={loading} error={error} />

      {/* History */}
      {history.length > 0 && (
        <div>
          <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: '#4a4a6a' }}>
            Recent Analyses
          </div>
          <div className="flex flex-wrap gap-2">
            {history.map((a) => {
              const color =
                a.sentiment === 'Bullish' ? '#00d4a0' : a.sentiment === 'Bearish' ? '#ff4d6d' : '#f5a623'
              return (
                <button
                  key={a.ticker}
                  onClick={() => { setAnalysis(a) }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded font-mono text-xs transition-all"
                  style={{ background: '#0f0f17', border: '1px solid #1e1e2e', color: '#e2e2f0' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#f5a623')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e1e2e')}
                >
                  <span style={{ color }}>{a.sentiment === 'Bullish' ? '▲' : a.sentiment === 'Bearish' ? '▼' : '◆'}</span>
                  {a.ticker}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
