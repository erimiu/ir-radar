import { supabase } from '@/lib/supabase'
import FeedbackClient from './FeedbackClient'

export const dynamic = 'force-dynamic'

export interface WeeklyReport {
  id: string
  week_start: string
  report: string
  card_count: number
  created_at: string
}

export default async function FeedbackPage() {
  const [recordCardsResult, weeklyReportsResult] = await Promise.all([
    supabase.from('record_cards').select('recorded_on'),
    supabase
      .from('weekly_reports')
      .select('id, week_start, report, card_count, created_at')
      .order('week_start', { ascending: false }),
  ])

  const checkCounts: Record<string, number> = {}
  for (const card of recordCardsResult.data ?? []) {
    const date = card.recorded_on as string
    checkCounts[date] = (checkCounts[date] ?? 0) + 1
  }

  const todayJST = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)

  return (
    <FeedbackClient
      checkCounts={checkCounts}
      todayJST={todayJST}
      weeklyReports={(weeklyReportsResult.data ?? []) as WeeklyReport[]}
    />
  )
}
