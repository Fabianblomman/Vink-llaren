import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { ticker } = await req.json()

    if (!ticker || typeof ticker !== 'string') {
      return NextResponse.json({ error: 'Missing ticker' }, { status: 400 })
    }

    const prompt = `You are a senior equity research analyst. Analyze the stock ticker "${ticker.toUpperCase()}" and return a JSON object with EXACTLY this structure (no extra fields, no markdown):

{
  "ticker": "${ticker.toUpperCase()}",
  "companySummary": "2-3 sentence overview of the company, its business model, and market position",
  "bullCase": "2-3 sentence bull case for investing in this stock",
  "bearCase": "2-3 sentence bear case / key risks",
  "keyMetrics": ["metric1", "metric2", "metric3", "metric4", "metric5"],
  "sentiment": "Bullish" | "Neutral" | "Bearish"
}

keyMetrics should be concise strings like "P/E: 28.5", "Market Cap: $2.9T", "Revenue Growth: 8% YoY".
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
