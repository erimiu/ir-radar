import HomeClient from './HomeClient'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export interface HomeStats {
  memoCount: number
  starCount: number
  nextStarIn: number
  savedLaterCount: number
  streak: number
  knownCompanyCount: number
}

function calcStreak(dates: string[]): number {
  if (dates.length === 0) return 0
  const uniqueDays = Array.from(new Set(dates.map(d => d.slice(0, 10))))
    .sort((a, b) => b.localeCompare(a))
  if (uniqueDays.length === 0) return 0

  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const yesterdayStr = new Date(now.getTime() - 86400000).toISOString().slice(0, 10)

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
  const [memoResult, savedLaterResult, memoDatesResult, knownCompanyResult] = await Promise.all([
    supabase.from('memos').select('*', { count: 'exact', head: true }).eq('synced_to_notion', true),
    supabase.from('items').select('*', { count: 'exact', head: true }).eq('saved_for_later', true),
    supabase.from('memos').select('created_at').eq('synced_to_notion', true).order('created_at', { ascending: false }),
    supabase.from('company_notes').select('*', { count: 'exact', head: true }),
  ])

  const memoCount = memoResult.count ?? 0
  const savedLaterCount = savedLaterResult.count ?? 0
  const knownCompanyCount = knownCompanyResult.count ?? 0
  const streak = calcStreak(memoDatesResult.data?.map(m => m.created_at as string) ?? [])
  const remainder = memoCount % 10
  const starCount = Math.floor(memoCount / 10)
  const nextStarIn = remainder === 0 ? 10 : 10 - remainder

  const stats: HomeStats = { memoCount, starCount, nextStarIn, savedLaterCount, streak, knownCompanyCount }
  return <HomeClient stats={stats} />
}
