import { supabase } from '@/lib/supabase'
import SettingsClient from './SettingsClient'

export const dynamic = 'force-dynamic'

export interface BenchmarkCompany {
  id: string
  securities_code: string
  company_name: string
  created_at: string
}

export default async function SettingsPage() {
  const { data } = await supabase
    .from('benchmark_companies')
    .select('*')
    .order('securities_code')

  return <SettingsClient initialCompanies={(data ?? []) as BenchmarkCompany[]} />
}
