import DisclosureClient from './DisclosureClient'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export interface TdnetItem {
  id: string
  pubdate: string
  company_code: string
  company_name: string
  title: string
  document_url: string
  markets_string: string
}

async function fetchReadUrls(): Promise<string[]> {
  const { data } = await supabase
    .from('items')
    .select('url')
    .is('source_id', null)
    .eq('is_read', true)
  return (data ?? []).map(i => i.url as string)
}

async function fetchSavedLaterUrls(): Promise<string[]> {
  const { data } = await supabase
    .from('items')
    .select('url')
    .is('source_id', null)
    .eq('saved_for_later', true)
  return (data ?? []).map(i => i.url as string)
}

async function fetchBenchmarkCodes(): Promise<string[]> {
  const { data } = await supabase
    .from('benchmark_companies')
    .select('securities_code')
  return (data ?? []).map(i => i.securities_code as string)
}

export default async function DisclosurePage() {
  const [readUrls, savedLaterUrls, benchmarkCodes] = await Promise.all([
    fetchReadUrls(),
    fetchSavedLaterUrls(),
    fetchBenchmarkCodes(),
  ])
  return (
    <DisclosureClient
      initialReadUrls={readUrls}
      initialSavedLaterUrls={savedLaterUrls}
      benchmarkCodes={benchmarkCodes}
    />
  )
}
