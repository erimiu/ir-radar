import { supabase } from '@/lib/supabase'
import MemosClient from './MemosClient'

export const dynamic = 'force-dynamic'

export default async function MemosPage() {
  const { data } = await supabase
    .from('memos')
    .select('*, items(title, url, sources(name, category))')
    .eq('synced_to_notion', true)
    .order('created_at', { ascending: false })

  return <MemosClient memos={data ?? []} />
}
