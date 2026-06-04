import { supabase } from '@/lib/supabase'
import FeedClient from './FeedClient'
import type { Item, Source } from '@/types'

export const dynamic = 'force-dynamic'

export default async function FeedPage() {
  const [itemsRes, sourcesRes] = await Promise.all([
    supabase
      .from('items')
      .select('*, sources(*)')
      .eq('is_saved', false)
      .order('rule_score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('sources')
      .select('*')
      .eq('enabled', true)
      .order('tier', { ascending: true })
      .order('name', { ascending: true }),
  ])

  const items: Item[] = itemsRes.data ?? []
  const sources: Source[] = sourcesRes.data ?? []
  const linkSources = sources.filter(s => s.fetch_type === 'link')

  return <FeedClient items={items} linkSources={linkSources} />
}
