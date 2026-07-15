import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { notion } from '@/lib/notion'

export async function POST(req: Request) {
  const { card_type, title, body, recorded_on } = await req.json()

  const todayStr = new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('record_cards')
    .insert({ card_type, title, body, recorded_on: recorded_on ?? todayStr })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // news_case カードで Notion 連携が有効な場合
  if (card_type === 'news_case' && body?.sync_notion && data) {
    try {
      await notion.pages.create({
        parent: { database_id: process.env.NOTION_DATABASE_ID! },
        properties: {
          Title: { title: [{ text: { content: title } }] },
          URL: body.url ? { url: body.url } : { url: null },
          カテゴリ: body.category
            ? { multi_select: [{ name: body.category }] }
            : { multi_select: [] },
          重要度: { select: null },
          ソース: {
            rich_text: [{ text: { content: body.company_name ?? 'IR Skill Up 記録' } }],
          },
          メモ: { rich_text: [{ text: { content: body.learning ?? '' } }] },
        },
      })
    } catch {
      // Notion 連携失敗は無視（記録カード自体は保存済み）
    }
  }

  return NextResponse.json(data)
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const date = searchParams.get('date')

  let query = supabase.from('record_cards').select('*').order('created_at', { ascending: false })
  if (type) query = query.eq('card_type', type)
  if (date) query = query.eq('recorded_on', date)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
