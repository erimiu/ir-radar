import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const anthropic = new Anthropic()

function getLastMonthRange(): { monthStart: string; monthEnd: string } | null {
  // Vercel は UTC で動くため JST に変換（UTC+9）
  const nowJST = new Date(Date.now() + 9 * 60 * 60 * 1000)
  // JST の日付が1日でなければスキップ（28-31日にも起動するため）
  if (nowJST.getUTCDate() !== 1) return null

  const year = nowJST.getUTCFullYear()
  const month = nowJST.getUTCMonth() // 0-indexed、現在月

  const prevYear = month === 0 ? year - 1 : year
  const prevMonth = month === 0 ? 11 : month - 1

  const monthStart = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-01`
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const monthEnd = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  return { monthStart, monthEnd }
}

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const range = getLastMonthRange()
  if (!range) {
    return NextResponse.json({ message: 'Not the 1st of month in JST, skipping' })
  }

  const { monthStart, monthEnd } = range

  // 同じ月のレポートが既に存在すれば何もしない（冪等）
  const { data: existing } = await supabase
    .from('monthly_reports')
    .select('id')
    .eq('month_start', monthStart)
    .single()

  if (existing) {
    return NextResponse.json({ message: 'Already exists', month_start: monthStart })
  }

  // 前月の record_cards を全件取得
  const { data: cards, error: cardsError } = await supabase
    .from('record_cards')
    .select('card_type, title, body, recorded_on')
    .gte('recorded_on', monthStart)
    .lte('recorded_on', monthEnd)
    .order('recorded_on', { ascending: true })

  if (cardsError) {
    return NextResponse.json({ error: cardsError.message }, { status: 500 })
  }

  const cardCount = cards?.length ?? 0

  // キャリアカードの「やりたいこと・目標」を全件取得（達成済み含む、月を跨ぐ）
  const { data: allCareerCards } = await supabase
    .from('record_cards')
    .select('title, body, recorded_on')
    .eq('card_type', 'career')
    .order('recorded_on', { ascending: true })

  const goals = (allCareerCards ?? []).filter(
    (c) => (c.body as { type?: string })?.type === 'goal'
  )

  // カードが 0 枚の月は定型文を保存して終了
  if (cardCount === 0) {
    await supabase.from('monthly_reports').insert({
      month_start: monthStart,
      report: '先月はお休みでした。今月も無理せず、一歩ずつ積み上げていきましょう。',
      card_count: 0,
    })
    return NextResponse.json({ message: 'No cards, saved default', month_start: monthStart })
  }

  const cardsJson = JSON.stringify(
    cards?.map(c => ({
      種別: c.card_type,
      タイトル: c.title,
      内容: c.body,
      日付: c.recorded_on,
    })),
    null,
    2
  )

  const goalsJson = JSON.stringify(
    goals.map(c => ({
      タイトル: c.title,
      内容: c.body,
      記録日: c.recorded_on,
    })),
    null,
    2
  )

  // 指示書記載のプロンプト（一字一句そのまま）
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: `あなたは、IR担当者のキャリア成長に伴走するプロのコーチです。
ユーザーの1ヶ月の記録カードと、本人の「やりたいこと・目標」リストをもとに、
月次コーチングレポートを作ります。

トーン：温かく、しかし内容は具体的に。抽象的な励ましで終わらせない。
構成（見出しは付けず、自然な流れで）：
1. 今月の活動の全体像を一言で認める
2. 目標リストと今月の記録を結びつける——「この経験は、この目標への布石になっている」
   という接続を1〜2個、具体的に指摘する
3. 来月に向けた具体的な行動提案を1つだけ（多く提案しない。1つに絞る）
ルール：
- ユーザーが書いた言葉を必ず引用する
- 目標に対して進んでいない領域があっても責めない。「まだ手つかず」の指摘はせず、
  進んだところとの接続だけを語る
- 行動提案は「明日からできる小ささ」にする（例：「◯◯系のセミナーを1つ探して
  つながりカードを1枚増やす」レベル）
- 600字以内`,
    messages: [
      {
        role: 'user',
        content: `今月の記録カード：
${cardsJson}

やりたいこと・目標リスト（達成状況含む）：
${goalsJson}

月次コーチングレポートを作成してください。`,
      },
    ],
  })

  const reportText =
    message.content[0].type === 'text' ? message.content[0].text : ''

  const { error: insertError } = await supabase.from('monthly_reports').insert({
    month_start: monthStart,
    report: reportText,
    card_count: cardCount,
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({
    message: 'Monthly report generated',
    month_start: monthStart,
    card_count: cardCount,
  })
}
