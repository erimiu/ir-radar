import { supabase } from '@/lib/supabase'
import NewsClient from './NewsClient'

export const dynamic = 'force-dynamic'

export interface NewsItem {
  id: string
  source: 'memo' | 'record_card'
  title: string
  learning: string | null
  company_name: string | null
  securities_code: string | null
  category: string | null
  url: string | null
  recorded_on: string
}

export default async function NewsPage() {
  const [memosResult, recordCardsResult] = await Promise.all([
    supabase
      .from('memos')
      .select('id, note, category_tags, company_name, securities_code, created_at, items(title, url)')
      .order('created_at', { ascending: false }),
    supabase
      .from('record_cards')
      .select('id, title, body, recorded_on')
      .eq('card_type', 'news_case')
      .order('recorded_on', { ascending: false }),
  ])

  const memos: NewsItem[] = (memosResult.data ?? []).map(m => {
    const itemData = (m.items as unknown as { title: string; url: string } | null)
    return {
      id: `memo-${m.id}`,
      source: 'memo' as const,
      title: itemData?.title ?? '（タイトルなし）',
      learning: m.note ?? null,
      company_name: m.company_name ?? null,
      securities_code: m.securities_code ?? null,
      category: m.category_tags?.[0] ?? null,
      url: itemData?.url ?? null,
      recorded_on: (m.created_at as string).slice(0, 10),
    }
  })

  const recordCards: NewsItem[] = (recordCardsResult.data ?? []).map(c => {
    const body = c.body as {
      learning?: string
      company_name?: string
      securities_code?: string
      category?: string
      url?: string
    }
    return {
      id: `card-${c.id}`,
      source: 'record_card' as const,
      title: c.title,
      learning: body.learning ?? null,
      company_name: body.company_name ?? null,
      securities_code: body.securities_code ?? null,
      category: body.category ?? null,
      url: body.url ?? null,
      recorded_on: c.recorded_on as string,
    }
  })

  const items = [...recordCards, ...memos].sort((a, b) =>
    b.recorded_on.localeCompare(a.recorded_on)
  )

  return <NewsClient items={items} />
}
