import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import MemoClient from './MemoClient'

export const dynamic = 'force-dynamic'

export default async function MemoPage({ params }: { params: { itemId: string } }) {
  const [itemRes, memoRes] = await Promise.all([
    supabase.from('items').select('*, sources(*)').eq('id', params.itemId).single(),
    supabase.from('memos').select('*').eq('item_id', params.itemId).maybeSingle(),
  ])

  if (!itemRes.data) notFound()

  return <MemoClient item={itemRes.data} existingMemo={memoRes.data} />
}
