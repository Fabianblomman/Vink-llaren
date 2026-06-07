'use client'

interface StockAnalysis {
  ticker: string
  companySummary: string
  bullCase: string
  bearCase: string
  keyMetrics: string[]
  sentiment: 'Bullish' | 'Neutral' | 'Bearish'
}

interface Props {
  analysis: StockAnalysis | null
  loading: boolean
  error: string | null
}

const SENTIMENT_STYLE = {
  Bullish: { color: '#00d4a0', bg: 'rgba(0,212,160,0.1)', icon: '▲' },
  Neutral: { color: '#f5a623', bg: 'rgba(245,166,35,0.1)', icon: '◆' },
  Bearish: { color: '#ff4d6d', bg: 'rgba(255,77,109,0.1)', icon: '▼' },
}

export default function StockAnalysisCard({ analysis, loading, error }: Props) {
  if (loading) {
    return (
      <div
        className="rounded-lg p-6 space-y-4 animate-pulse"
        style={{ background: '#0f0f17', border: '1px solid #1e1e2e' }}
      >
        <div className="h-5 rounded w-1/4" style={{ background: '#1e1e2e' }} />
        <div className="h-3 rounded w-3/4" style={{ background: '#1e1e2e' }} />
        <div className="h-3 rounded w-2/3" style={{ background: '#1e1e2e' }} />
        <div className="h-3 rounded w-1/2" style={{ background: '#1e1e2e' }} />
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="h-24 rounded" style={{ background: '#1e1e2e' }} />
          <div className="h-24 rounded" style={{ background: '#1e1e2e' }} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="rounded-lg p-6"
        style={{ background: '#0f0f17', border: '1px solid #ff4d6d' }}
      >
        <div className="font-mono text-sm" style={{ color: '#ff4d6d' }}>
          ERROR: {error}
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div
        className="rounded-lg p-8 text-center"
        style={{ background: '#0f0f17', border: '1px solid #1e1e2e' }}
      >
        <div className="text-4xl mb-3" style={{ color: '#1e1e2e' }}>⬡</div>
        <p className="font-mono text-sm" style={{ color: '#4a4a6a' }}>
          Enter a ticker and run analysis to see AI insights
        </p>
      </div>
    )
  }

  const s = SENTIMENT_STYLE[analysis.sentiment]

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: '1px solid #1e1e2e' }}
    >
      {/* Header */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ background: '#0f0f17', borderBottom: '1px solid #1e1e2e' }}
      >
        <div>
          <span className="font-mono font-bold text-xl" style={{ color: '#f5a623' }}>
            {analysis.ticker}
          </span>
          <span className="ml-3 font-mono text-xs" style={{ color: '#4a4a6a' }}>
            AI ANALYSIS
          </span>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1 rounded-full font-mono text-sm font-semibold"
          style={{ color: s.color, background: s.bg }}
        >
          <span>{s.icon}</span>
          <span>{analysis.sentiment.toUpperCase()}</span>
        </div>
      </div>

      <div className="p-6 space-y-5" style={{ background: '#0a0a0f' }}>
        {/* Summary */}
        <div>
          <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: '#4a4a6a' }}>
            Company Overview
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#e2e2f0' }}>
            {analysis.companySummary}
          </p>
        </div>

        {/* Bull / Bear */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className="rounded-lg p-4"
            style={{ background: '#0f0f17', border: '1px solid rgba(0,212,160,0.2)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span style={{ color: '#00d4a0' }}>▲</span>
              <span className="text-xs font-mono uppercase tracking-widest" style={{ color: '#00d4a0' }}>
                Bull Case
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#e2e2f0' }}>
              {analysis.bullCase}
            </p>
          </div>
          <div
            className="rounded-lg p-4"
            style={{ background: '#0f0f17', border: '1px solid rgba(255,77,109,0.2)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span style={{ color: '#ff4d6d' }}>▼</span>
              <span className="text-xs font-mono uppercase tracking-widest" style={{ color: '#ff4d6d' }}>
                Bear Case
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#e2e2f0' }}>
              {analysis.bearCase}
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div>
          <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: '#4a4a6a' }}>
            Key Metrics
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.keyMetrics.map((m, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded font-mono text-xs"
                style={{ background: '#0f0f17', border: '1px solid #1e1e2e', color: '#e2e2f0' }}
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
