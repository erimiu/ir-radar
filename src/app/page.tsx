import { supabase } from '@/lib/supabase'
import FeedClient from './FeedClient'
import type { Item, Source } from '@/types'

export const dynamic = 'force-dynamic'

export default async function FeedPage() {
  const [itemsRes, memoItemsRes, sourcesRes] = await Promise.all([
    supabase
      .from('items')
      .select('*, sources(*)')
      .order('rule_score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('memos')
      .select('item_id'),
    supabase
      .from('sources')
      .select('*')
      .eq('enabled', true)
      .order('tier', { ascending: true })
      .order('name', { ascending: true }),
  ])

  // memosテーブルに存在するitem_idをすべてフィードから除外
  const memoItemIds = new Set((memoItemsRes.data ?? []).map(m => m.item_id))
  const items: Item[] = (itemsRes.data ?? []).filter(item => !memoItemIds.has(item.id))

  const sources: Source[] = sourcesRes.data ?? []
  const linkSources = sources.filter(s => s.fetch_type === 'link')

  return <FeedClient items={items} linkSources={linkSources} />
}
