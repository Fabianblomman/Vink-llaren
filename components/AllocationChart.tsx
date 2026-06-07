'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { PositionWithPrice } from '@/lib/portfolio'

const COLORS = [
  '#f5a623', '#00d4a0', '#6c63ff', '#ff6b9d', '#00b4d8',
  '#90e0ef', '#f72585', '#7209b7', '#3a0ca3', '#4cc9f0',
]

interface Props {
  positions: PositionWithPrice[]
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { value: number; pct: string } }> }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div
      className="px-3 py-2 rounded text-sm font-mono"
      style={{ background: '#13131e', border: '1px solid #1e1e2e', color: '#e2e2f0' }}
    >
      <div style={{ color: '#f5a623' }}>{d.name}</div>
      <div>${d.payload.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
      <div style={{ color: '#4a4a6a' }}>{d.payload.pct}%</div>
    </div>
  )
}

export default function AllocationChart({ positions }: Props) {
  const total = positions.reduce((s, p) => s + p.value, 0)

  const data = positions.map((p) => ({
    name: p.ticker,
    value: Math.round(p.value),
    pct: ((p.value / total) * 100).toFixed(1),
  }))

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-64 rounded-lg"
        style={{ background: '#0f0f17', border: '1px solid #1e1e2e' }}
      >
        <span className="font-mono text-sm" style={{ color: '#4a4a6a' }}>
          No positions — add some to see allocation
        </span>
      </div>
    )
  }

  return (
    <div
      className="rounded-lg p-4"
      style={{ background: '#0f0f17', border: '1px solid #1e1e2e' }}
    >
      <h3 className="font-sans font-semibold text-sm mb-4 tracking-widest uppercase" style={{ color: '#f5a623' }}>
        Portfolio Allocation
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="font-mono text-xs" style={{ color: '#e2e2f0' }}>
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
