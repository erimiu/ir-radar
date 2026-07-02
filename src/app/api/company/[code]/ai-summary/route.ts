import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(
  _req: Request,
  { params }: { params: { code: string } }
) {
  const { code } = params

  // 生成済みなら再生成しない
  const { data: existing } = await supabase
    .from('company_notes')
    .select('ai_summary')
    .eq('code', code)
    .single()

  if (existing?.ai_summary) {
    return NextResponse.json({ already_exists: true })
  }

  const { data: company } = await supabase
    .from('companies')
    .select('name, market')
    .eq('code', code)
    .single()

  const companyName = company?.name ?? `証券コード${code}`
  const market = company?.market ?? ''

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompt = `あなたはIR（投資家向け広報）の専門家です。以下の日本の上場会社について、IR担当者の視点で簡潔に解説してください。

会社名：${companyName}（${market}）
証券コード：${code}

以下の内容を10行程度でまとめてください：
1. どんなビジネスモデルか・収益の柱
2. 規模感（大型・中型・小型グロース等の肌感）
3. IR担当目線での注目点（株主還元の姿勢、個人投資家向け施策、開示の特徴など）
4. 公式IRサイトのURL（分かる場合のみ。URLが確実でない場合は「不明」と答えること。絶対にURLを創作しないでください）

知識が古い可能性があるため、確実な情報のみ記載し、不確かな情報は「詳細不明」と書いてください。`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const summary =
      message.content[0].type === 'text' ? message.content[0].text : ''
    const now = new Date().toISOString()

    await supabase
      .from('company_notes')
      .upsert(
        { code, ai_summary: summary, ai_generated_at: now, updated_at: now },
        { onConflict: 'code' }
      )

    return NextResponse.json({ summary, generated_at: now })
  } catch (e) {
    console.error('[ai-summary]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'generation failed' },
      { status: 500 }
    )
  }
}
