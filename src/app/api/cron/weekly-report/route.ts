import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const anthropic = new Anthropic()

function getLastWeekRange(): { weekStart: string; weekEnd: string } {
  // Vercel は UTC で動くため、JST に変換してから計算
  const nowJST = new Date(Date.now() + 9 * 60 * 60 * 1000)
  // 月曜朝に起動するので、-7日 = 前週の月曜
  const lastMon = new Date(nowJST)
  lastMon.setUTCDate(nowJST.getUTCDate() - 7)
  const lastSun = new Date(lastMon)
  lastSun.setUTCDate(lastMon.getUTCDate() + 6)
  return {
    weekStart: lastMon.toISOString().slice(0, 10),
    weekEnd: lastSun.toISOString().slice(0, 10),
  }
}

export async function GET(req: Request) {
  // Vercel Cron が送る Authorization ヘッダーで認証
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { weekStart, weekEnd } = getLastWeekRange()

  // 同じ週のレポートが既に存在すれば何もしない
  const { data: existing } = await supabase
    .from('weekly_reports')
    .select('id')
    .eq('week_start', weekStart)
    .single()

  if (existing) {
    return NextResponse.json({ message: 'Already exists', week_start: weekStart })
  }

  // 先週の record_cards を取得
  const { data: cards, error: cardsError } = await supabase
    .from('record_cards')
    .select('card_type, title, body, recorded_on')
    .gte('recorded_on', weekStart)
    .lte('recorded_on', weekEnd)
    .order('recorded_on', { ascending: true })

  if (cardsError) {
    return NextResponse.json({ error: cardsError.message }, { status: 500 })
  }

  const cardCount = cards?.length ?? 0

  // カードが 0 枚の週は定型文を保存して終了
  if (cardCount === 0) {
    await supabase.from('weekly_reports').insert({
      week_start: weekStart,
      report: '先週はお休みでした。今週も気楽にいきましょう。',
      card_count: 0,
    })
    return NextResponse.json({ message: 'No cards, saved default', week_start: weekStart })
  }

  // Claude に渡す cards_json を組み立て
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

  // 指示書記載のプロンプト（一字一句そのまま）
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system: `あなたは、多忙な一人IR担当者に寄り添うパーソナルコーチです。
ユーザーが1週間に書き溜めた記録カードをもとに、「今週のおさらい」を作ります。

トーン：温かく、簡潔に。説教しない。頑張りを認め、書かれた内容の価値を言語化する。
ルール：
- ユーザーが実際に書いた言葉を1〜2箇所引用して返す（見てもらえている実感のため）
- 記録が少ない週でも、少ないことを指摘しない。書けた分の価値だけを語る
- 400字以内。箇条書きは使わず、語りかける文章で`,
    messages: [
      {
        role: 'user',
        content: `今週の記録カードは以下の通りです。「今週のおさらい」を作成してください。

${cardsJson}
（各カードの種別・タイトル・内容・日付を含むJSON）`,
      },
    ],
  })

  const reportText =
    message.content[0].type === 'text' ? message.content[0].text : ''

  const { error: insertError } = await supabase.from('weekly_reports').insert({
    week_start: weekStart,
    report: reportText,
    card_count: cardCount,
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({
    message: 'Weekly report generated',
    week_start: weekStart,
    card_count: cardCount,
  })
}
