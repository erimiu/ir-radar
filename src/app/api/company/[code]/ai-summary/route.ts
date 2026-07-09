import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `あなたは日本の上場企業のIR（インベスター・リレーションズ）実務に精通したアナリストです。
IR担当者が初見の企業を素早く理解するための「一次理解カード」を作成します。

重要なルール：
- 確実に知っていることだけを書く。不確かな情報は「不明」または「要確認」と明記する
- URLは絶対に創作しない。確実に知っている場合のみ記載し、少しでも不確かなら「不明」とする
- 財務の具体的な数値（時価総額・売上高など）は変動するため書かない。規模の肌感のみ伝える
- あなたの知識には時点の限界があることを前提に、断定を避けた表現を使う
- 出力はJSON形式のみ。前置きやマークダウンの装飾は一切付けない`

function buildUserPrompt(companyName: string, code: string, market: string): string {
  return `以下の日本の上場企業について、IR担当者向けの一次理解カードを作成してください。

企業名：${companyName}
証券コード：${code}
市場区分：${market}

以下のJSON形式で回答してください：

{
  "business_model": "どんなビジネスモデルの会社か。何を売って誰から収益を得ているか。2〜3文",
  "revenue_pillars": "収益の柱・主力事業。1〜2文。不明なら「要確認」",
  "scale_feel": "規模の肌感（例：業界最大手クラス／中堅／小型グロース）。具体的な金額は書かない。1文",
  "ir_notes": "IR担当者目線での注目点。株主還元の姿勢、個人投資家向け施策、開示・IRの特徴など、知っていることがあれば2〜3文。特筆すべき情報がなければ「特筆情報なし。IRサイトで確認を推奨」",
  "ir_site_url": "公式IRサイトのURL。確実に知っている場合のみ。不確かなら「不明」",
  "confidence": "high / medium / low のいずれか。この企業についてのあなたの知識の確度",
  "caveat": "この情報の限界について1文（例：知識時点以降の変化は反映されていない等）"
}

この会社についてほとんど知識がない場合は、無理に埋めず各項目を「不明」とし、
confidence を low としてください。誤った情報を書くより「不明」の方が価値があります。`
}

export async function POST(
  _req: Request,
  { params }: { params: { code: string } }
) {
  const { code } = params

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

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(companyName, code, market) }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''

    let parsed: Record<string, string>
    try {
      parsed = JSON.parse(text)
    } catch {
      console.error('[ai-summary] JSON parse failed:', text.slice(0, 200))
      return NextResponse.json({ error: 'parse_failed' }, { status: 422 })
    }

    const now = new Date().toISOString()

    await supabase
      .from('company_notes')
      .upsert(
        { code, ai_summary: JSON.stringify(parsed), ai_generated_at: now, updated_at: now },
        { onConflict: 'code' }
      )

    return NextResponse.json({ parsed, generated_at: now })
  } catch (e) {
    console.error('[ai-summary]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'generation failed' },
      { status: 500 }
    )
  }
}
