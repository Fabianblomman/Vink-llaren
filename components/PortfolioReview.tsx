'use client'

interface PortfolioAnalysis {
  diversificationScore: number
  concentrationRisks: string[]
  recommendations: string[]
  summary: string
}

interface Props {
  analysis: PortfolioAnalysis | null
  loading: boolean
  error: string | null
  onAnalyze: () => void
}

function ScoreRing({ score }: { score: number }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 70 ? '#00d4a0' : score >= 40 ? '#f5a623' : '#ff4d6d'

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg width="96" height="96" className="-rotate-90">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="#1e1e2e" strokeWidth="8" />
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-mono font-bold text-xl" style={{ color }}>
          {score}
        </div>
        <div className="font-mono text-xs" style={{ color: '#4a4a6a' }}>
          /100
        </div>
      </div>
    </div>
  )
}

export default function PortfolioReview({ analysis, loading, error, onAnalyze }: Props) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: '1px solid #1e1e2e' }}
    >
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ background: '#0f0f17', borderBottom: '1px solid #1e1e2e' }}
      >
        <div>
          <span className="font-sans font-semibold" style={{ color: '#e2e2f0' }}>
            AI Portfolio Review
          </span>
          <span className="ml-3 font-mono text-xs" style={{ color: '#4a4a6a' }}>
            // POWERED BY CLAUDE
          </span>
        </div>
        <button
          onClick={onAnalyze}
          disabled={loading}
          className="px-4 py-2 rounded font-mono text-sm font-semibold transition-all duration-200 disabled:opacity-50"
          style={{
            background: loading ? '#1e1e2e' : 'rgba(245,166,35,0.15)',
            color: '#f5a623',
            border: '1px solid rgba(245,166,35,0.3)',
          }}
        >
          {loading ? '◌ Analyzing...' : '▶ Run Analysis'}
        </button>
      </div>

      <div className="p-6" style={{ background: '#0a0a0f' }}>
        {error && (
          <div className="font-mono text-sm mb-4 p-3 rounded" style={{ color: '#ff4d6d', background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.2)' }}>
            ERROR: {error}
          </div>
        )}

        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full" style={{ background: '#1e1e2e' }} />
              <div className="flex-1 space-y-2">
                <div className="h-4 rounded w-2/3" style={{ background: '#1e1e2e' }} />
                <div className="h-3 rounded w-1/2" style={{ background: '#1e1e2e' }} />
              </div>
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded" style={{ background: '#1e1e2e' }} />
              ))}
            </div>
          </div>
        )}

        {!loading && !analysis && !error && (
          <div className="text-center py-10">
            <div className="font-mono text-3xl mb-3" style={{ color: '#1e1e2e' }}>◈</div>
            <p className="font-mono text-sm" style={{ color: '#4a4a6a' }}>
              Click &ldquo;Run Analysis&rdquo; to get AI-powered portfolio insights
            </p>
          </div>
        )}

        {!loading && analysis && (
          <div className="space-y-6">
            {/* Score + summary */}
            <div className="flex items-center gap-6">
              <ScoreRing score={analysis.diversificationScore} />
              <div>
                <div className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: '#4a4a6a' }}>
                  Diversification Score
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#e2e2f0' }}>
                  {analysis.summary}
                </p>
              </div>
            </div>

            {/* Concentration Risks */}
            {analysis.concentrationRisks.length > 0 && (
              <div>
                <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: '#4a4a6a' }}>
                  Concentration Risks
                </div>
                <div className="space-y-2">
                  {analysis.concentrationRisks.map((risk, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 px-4 py-3 rounded"
                      style={{ background: 'rgba(255,77,109,0.06)', border: '1px solid rgba(255,77,109,0.15)' }}
                    >
                      <span style={{ color: '#ff4d6d' }}>!</span>
                      <span className="text-sm" style={{ color: '#e2e2f0' }}>{risk}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div>
              <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: '#4a4a6a' }}>
                Top Recommendations
              </div>
              <div className="space-y-3">
                {analysis.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 px-4 py-3 rounded"
                    style={{ background: '#0f0f17', border: '1px solid #1e1e2e' }}
                  >
                    <span className="font-mono font-bold text-xs mt-0.5" style={{ color: '#f5a623' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm" style={{ color: '#e2e2f0' }}>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
