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

async function fetchTdnetItemFlags(): Promise<{ readUrls: string[]; savedLaterUrls: string[] }> {
  // items テーブルを1回のクエリで既読・あとで読む両方を取得（DBラウンドトリップ削減）
  const { data } = await supabase
    .from('items')
    .select('url, is_read, saved_for_later')
    .is('source_id', null)
    .or('is_read.eq.true,saved_for_later.eq.true')
  const readUrls: string[] = []
  const savedLaterUrls: string[] = []
  for (const i of data ?? []) {
    if (i.is_read) readUrls.push(i.url as string)
    if (i.saved_for_later) savedLaterUrls.push(i.url as string)
  }
  return { readUrls, savedLaterUrls }
}

async function fetchBenchmarkCodes(): Promise<string[]> {
  const { data } = await supabase
    .from('benchmark_companies')
    .select('securities_code')
  return (data ?? []).map(i => i.securities_code as string)
}

export default async function DisclosurePage() {
  const [{ readUrls, savedLaterUrls }, benchmarkCodes] = await Promise.all([
    fetchTdnetItemFlags(),
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
