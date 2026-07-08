import { supabase } from '@/lib/supabase'
import SettingsClient from './SettingsClient'

export const dynamic = 'force-dynamic'

export interface BenchmarkCompany {
  id: string
  securities_code: string
  company_name: string
  created_at: string
}

export interface ThemeFilter {
  id: string
  category: string
  keyword: string
  enabled: boolean
}

export default async function SettingsPage() {
  const [{ data: benchmarkData }, { data: filterData }] = await Promise.all([
    supabase.from('benchmark_companies').select('*').order('securities_code'),
    supabase.from('theme_filters').select('id, category, keyword, enabled').order('category').order('keyword'),
  ])

  return (
    <SettingsClient
      initialCompanies={(benchmarkData ?? []) as BenchmarkCompany[]}
      initialThemeFilters={(filterData ?? []) as ThemeFilter[]}
    />
  )
}
