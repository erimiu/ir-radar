import HomeClient from './HomeClient'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export interface HomeStats {
  newsCaseCount: number
  connectionCount: number
  companyCount: number
  careerCount: number
  streak: number
  starCount: number
  nextStarIn: number
  todayCount: number
  latestReportWeek: string | null
}

function calcStreak(dates: string[]): number {
  if (dates.length === 0) return 0
  const uniqueDays = Array.from(new Set(dates)).sort((a, b) => b.localeCompare(a))
  if (uniqueDays.length === 0) return 0

  const nowJST = new Date(new Date().getTime() + 9 * 60 * 60 * 1000)
  const todayStr = nowJST.toISOString().slice(0, 10)
  const yesterdayStr = new Date(nowJST.getTime() - 86400000).toISOString().slice(0, 10)

  if (uniqueDays[0] !== todayStr && uniqueDays[0] !== yesterdayStr) return 0

  let streak = 1
  for (let i = 1; i < uniqueDays.length; i++) {
    const prevMs = new Date(uniqueDays[i - 1]).getTime()
    const currMs = new Date(uniqueDays[i]).getTime()
    if (Math.round((prevMs - currMs) / 86400000) === 1) streak++
    else break
  }
  return streak
}

export default async function HomePage() {
  const todayStr = new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [memosResult, recordCardsResult, companyNotesResult, latestReportResult] =
    await Promise.all([
      supabase.from('memos').select('*', { count: 'exact', head: true }),
      supabase.from('record_cards').select('card_type, recorded_on'),
      supabase.from('company_notes').select('*', { count: 'exact', head: true }),
      supabase
        .from('weekly_reports')
        .select('week_start')
        .order('week_start', { ascending: false })
        .limit(1)
        .single(),
    ])

  const memoCount = memosResult.count ?? 0
  const recordCards = recordCardsResult.data ?? []
  const companyCount = companyNotesResult.count ?? 0

  const newsCaseCount = memoCount + recordCards.filter(c => c.card_type === 'news_case').length
  const connectionCount = recordCards.filter(c => c.card_type === 'connection').length
  const careerCount = recordCards.filter(c => c.card_type === 'career').length
  const todayCount = recordCards.filter(c => c.recorded_on === todayStr).length

  const totalCards = memoCount + recordCards.length
  const remainder = totalCards % 10
  const starCount = Math.floor(totalCards / 10)
  const nextStarIn = remainder === 0 ? 10 : 10 - remainder

  const streak = calcStreak(recordCards.map(c => c.recorded_on as string))

  const stats: HomeStats = {
    newsCaseCount,
    connectionCount,
    companyCount,
    careerCount,
    streak,
    starCount,
    nextStarIn,
    todayCount,
    latestReportWeek: latestReportResult.data?.week_start ?? null,
  }
  return <HomeClient stats={stats} />
}
