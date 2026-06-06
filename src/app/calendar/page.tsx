import { supabase } from '@/lib/supabase'
import CalendarClient from './CalendarClient'

export const dynamic = 'force-dynamic'

function toJSTDateStr(isoStr: string): string {
  const d = new Date(new Date(isoStr).getTime() + 9 * 60 * 60 * 1000)
  return d.toISOString().slice(0, 10)
}

async function fetchCheckCounts(): Promise<Record<string, number>> {
  const { data } = await supabase
    .from('items')
    .select('checked_at')
    .not('checked_at', 'is', null)
    .eq('is_read', true)

  const counts: Record<string, number> = {}
  for (const item of data ?? []) {
    if (!item.checked_at) continue
    const date = toJSTDateStr(item.checked_at as string)
    counts[date] = (counts[date] ?? 0) + 1
  }
  return counts
}

export default async function CalendarPage() {
  const checkCounts = await fetchCheckCounts()
  const todayJST = toJSTDateStr(new Date().toISOString())
  return <CalendarClient checkCounts={checkCounts} todayJST={todayJST} />
}
