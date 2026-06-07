export interface Position {
  id: string
  ticker: string
  shares: number
  avgBuyPrice: number
}

export interface PositionWithPrice extends Position {
  currentPrice: number
  value: number
  costBasis: number
  pnl: number
  pnlPercent: number
  dayChange: number
  dayChangePercent: number
}

// Seeded mock prices — deterministic so they don't flicker on re-render
const BASE_PRICES: Record<string, number> = {
  AAPL: 189.3,
  MSFT: 415.2,
  GOOGL: 175.8,
  AMZN: 185.4,
  NVDA: 875.6,
  TSLA: 248.5,
  META: 492.3,
  BRK: 402.1,
  JPM: 198.7,
  V: 278.4,
  JNJ: 152.3,
  WMT: 67.8,
  XOM: 118.9,
  UNH: 492.1,
  PG: 162.4,
  MA: 462.8,
  HD: 342.6,
  BAC: 38.7,
  ABBV: 178.9,
  CRM: 285.4,
  NFLX: 627.3,
  DIS: 112.4,
  INTC: 30.2,
  AMD: 152.8,
  COIN: 235.6,
  SPY: 523.4,
  QQQ: 445.7,
  VOO: 478.2,
}

// Day-change percentages — fixed per ticker
const DAY_CHANGES: Record<string, number> = {
  AAPL: 1.23,
  MSFT: -0.45,
  GOOGL: 2.1,
  AMZN: 0.87,
  NVDA: 3.42,
  TSLA: -2.15,
  META: 1.67,
  BRK: 0.32,
  JPM: -0.78,
  V: 0.54,
  JNJ: -0.21,
  WMT: 0.89,
  XOM: 1.45,
  UNH: -1.23,
  PG: 0.15,
  MA: 0.76,
  HD: -0.43,
  BAC: 1.12,
  ABBV: -0.67,
  CRM: 2.34,
  NFLX: 1.89,
  DIS: -0.92,
  INTC: -1.56,
  AMD: 2.78,
  COIN: 4.32,
  SPY: 0.42,
  QQQ: 0.67,
  VOO: 0.38,
}

export function getMockPrice(ticker: string): { price: number; dayChangePercent: number } {
  const upper = ticker.toUpperCase()
  const base = BASE_PRICES[upper] ?? 100 + (ticker.charCodeAt(0) * 3.7 % 400)
  const dayPct = DAY_CHANGES[upper] ?? ((ticker.charCodeAt(0) % 7) - 3) * 0.5
  return { price: base, dayChangePercent: dayPct }
}

export function enrichPositions(positions: Position[]): PositionWithPrice[] {
  return positions.map((pos) => {
    const { price, dayChangePercent } = getMockPrice(pos.ticker)
    const value = pos.shares * price
    const costBasis = pos.shares * pos.avgBuyPrice
    const pnl = value - costBasis
    const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0
    const dayChange = value * (dayChangePercent / 100)
    return {
      ...pos,
      currentPrice: price,
      value,
      costBasis,
      pnl,
      pnlPercent,
      dayChange,
      dayChangePercent,
    }
  })
}

export function portfolioSummary(positions: PositionWithPrice[]) {
  const totalValue = positions.reduce((s, p) => s + p.value, 0)
  const totalCost = positions.reduce((s, p) => s + p.costBasis, 0)
  const totalReturn = totalValue - totalCost
  const totalReturnPct = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0
  const dayChange = positions.reduce((s, p) => s + p.dayChange, 0)
  const dayChangePct = totalValue > 0 ? (dayChange / (totalValue - dayChange)) * 100 : 0

  const best = positions.reduce<PositionWithPrice | null>(
    (b, p) => (!b || p.pnlPercent > b.pnlPercent ? p : b),
    null
  )
  const worst = positions.reduce<PositionWithPrice | null>(
    (w, p) => (!w || p.pnlPercent < w.pnlPercent ? p : w),
    null
  )

  return { totalValue, totalCost, totalReturn, totalReturnPct, dayChange, dayChangePct, best, worst }
}

export const DEFAULT_POSITIONS: Position[] = [
  { id: '1', ticker: 'AAPL', shares: 25, avgBuyPrice: 155.0 },
  { id: '2', ticker: 'NVDA', shares: 10, avgBuyPrice: 620.0 },
  { id: '3', ticker: 'MSFT', shares: 15, avgBuyPrice: 380.0 },
  { id: '4', ticker: 'GOOGL', shares: 20, avgBuyPrice: 140.0 },
  { id: '5', ticker: 'TSLA', shares: 12, avgBuyPrice: 210.0 },
]
