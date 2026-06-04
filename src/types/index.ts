export type Category = 'disclosure' | 'regulation' | 'market' | 'ir_trend' | 'investment' | 'overseas'
export type FetchType = 'rss' | 'link'

export interface Source {
  id: string
  name: string
  url: string
  fetch_type: FetchType
  category: Category
  tier: 1 | 2 | 3 | 4
  is_company: boolean
  enabled: boolean
  created_at: string
}

export interface Item {
  id: string
  source_id: string | null
  title: string
  url: string
  published_at: string | null
  fetched_at: string
  rule_score: number
  ai_score: number | null
  ai_reason: string | null
  is_read: boolean
  is_saved: boolean
  created_at: string
  sources?: Source
}

export interface Memo {
  id: string
  item_id: string
  note: string | null
  category_tags: string[] | null
  importance: string | null
  synced_to_notion: boolean
  notion_page_url: string | null
  created_at: string
}

export const CATEGORY_LABELS: Record<Category | 'all', string> = {
  all: 'すべて',
  ir_trend: 'IRトレンド',
  disclosure: '開示',
  regulation: '規制',
  market: '市場',
  investment: '投資',
  overseas: '海外',
}

export const CATEGORY_LIST = [
  'all', 'ir_trend', 'disclosure', 'regulation', 'market', 'investment', 'overseas',
] as const

export type CategoryTab = (typeof CATEGORY_LIST)[number]
