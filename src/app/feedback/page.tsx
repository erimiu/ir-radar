import { supabase } from '@/lib/supabase'
import FeedbackClient from './FeedbackClient'

export const dynamic = 'force-dynamic'

export default async function FeedbackPage() {
  const { data } = await supabase.from('record_cards').select('recorded_on')

  const checkCounts: Record<string, number> = {}
  for (const card of data ?? []) {
    const date = card.recorded_on as string
    checkCounts[date] = (checkCounts[date] ?? 0) + 1
  }

  const todayJST = new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
  return <FeedbackClient checkCounts={checkCounts} todayJST={todayJST} />
}
