import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { positions } = await req.json()

    if (!Array.isArray(positions) || positions.length === 0) {
      return NextResponse.json({ error: 'No positions provided' }, { status: 400 })
    }

    const holdingsSummary = positions
      .map(
        (p: { ticker: string; shares: number; avgBuyPrice: number; value: number; pnlPercent: number }) =>
          `${p.ticker}: ${p.shares} shares @ $${p.avgBuyPrice} avg cost, current value $${p.value.toFixed(0)}, P&L ${p.pnlPercent.toFixed(1)}%`
      )
      .join('\n')

    const prompt = `You are a certified financial planner reviewing a client's stock portfolio. Here are the holdings:

${holdingsSummary}

Analyze this portfolio and return a JSON object with EXACTLY this structure (no markdown, no extra fields):

{
  "diversificationScore": <integer 0-100>,
  "concentrationRisks": ["risk1", "risk2"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "summary": "2-3 sentence overall assessment of the portfolio"
}

diversificationScore: 0 = extremely concentrated, 100 = perfectly diversified.
concentrationRisks: 1-3 specific risks (sector concentration, single-stock exposure, etc). Can be empty array if none.
recommendations: EXACTLY 3 actionable recommendations.
Respond ONLY with the JSON object.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    const analysis = JSON.parse(jsonMatch[0])
    return NextResponse.json(analysis)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
