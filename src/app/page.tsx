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

interface TdnetRaw {
  Tdnet: {
    id: string
    pubdate: string
    company_code: string
    company_name: string
    title: string
    document_url: string
    markets_string: string
  }
}

function getDateRange() {
  const today = new Date()
  const start = new Date(today)
  start.setDate(start.getDate() - 4)
  const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '')
  return { startDate: fmt(start), endDate: fmt(today) }
}

async function fetchDisclosures(): Promise<TdnetItem[] | null> {
  const { startDate, endDate } = getDateRange()
  try {
    const res = await fetch(
      `https://webapi.yanoshin.jp/webapi/tdnet/list/${startDate}-${endDate}.json`,
      { cache: 'no-store' }
    )
    if (!res.ok) return null
    const data = await res.json()
    return (data.items as TdnetRaw[]).map(i => ({
      id: i.Tdnet.id,
      pubdate: i.Tdnet.pubdate,
      company_code: i.Tdnet.company_code,
      company_name: i.Tdnet.company_name,
      title: i.Tdnet.title,
      document_url: i.Tdnet.document_url,
      markets_string: i.Tdnet.markets_string,
    }))
  } catch {
    return null
  }
}

async function fetchReadUrls(): Promise<string[]> {
  const { data } = await supabase
    .from('items')
    .select('url')
    .is('source_id', null)
    .eq('is_read', true)
  return (data ?? []).map(i => i.url as string)
}

export default async function DisclosurePage() {
  const [disclosures, readUrls] = await Promise.all([
    fetchDisclosures(),
    fetchReadUrls(),
  ])
  return <DisclosureClient initialDisclosures={disclosures} initialReadUrls={readUrls} />
}

// 将来の拡張: ベンチマーク銘柄に絞る場合は
// https://webapi.yanoshin.jp/webapi/tdnet/list/{証券コード}.json を使う
// （複数銘柄はハイフン区切り: 7203-9984-4689.json）
// 銘柄リストを設定画面で管理できるようにする構想
