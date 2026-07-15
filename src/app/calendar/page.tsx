import { supabase } from '@/lib/supabase'
import CalendarClient from './CalendarClient'

export const dynamic = 'force-dynamic'

async function fetchRecordCounts(): Promise<Record<string, number>> {
  const { data } = await supabase
    .from('record_cards')
    .select('recorded_on')

  const counts: Record<string, number> = {}
  for (const card of data ?? []) {
    const date = card.recorded_on as string
    counts[date] = (counts[date] ?? 0) + 1
  }
  return counts
}

export default async function CalendarPage() {
  const checkCounts = await fetchRecordCounts()
  const todayJST = new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
  return <CalendarClient checkCounts={checkCounts} todayJST={todayJST} />
}
