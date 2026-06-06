import DisclosureClient from './DisclosureClient'

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

async function fetchDisclosures(limit = 30): Promise<TdnetItem[] | null> {
  try {
    const res = await fetch(
      `https://webapi.yanoshin.jp/webapi/tdnet/list/recent.json?limit=${limit}`,
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

export default async function DisclosurePage() {
  const disclosures = await fetchDisclosures(30)
  return <DisclosureClient initialDisclosures={disclosures} />
}

// 将来の拡張: ベンチマーク銘柄に絞る場合は
// https://webapi.yanoshin.jp/webapi/tdnet/list/{証券コード}.json を使う
// （複数銘柄はハイフン区切り: 7203-9984-4689.json）
// 銘柄リストを設定画面で管理できるようにする構想
