import DisclosureClient from './DisclosureClient'
import { supabase } from '@/lib/supabase'
import * as https from 'https'

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

function httpsGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`))
        return
      }
      let body = ''
      res.on('data', (chunk: Buffer) => { body += chunk })
      res.on('end', () => resolve(body))
    }).on('error', reject)
  })
}

async function fetchDisclosures(): Promise<TdnetItem[] | null> {
  const { startDate, endDate } = getDateRange()
  try {
    const body = await httpsGet(
      `https://webapi.yanoshin.jp/webapi/tdnet/list/${startDate}-${endDate}.json`
    )
    const data = JSON.parse(body)
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
  const [disclosures, readUrls, savedLaterUrls, benchmarkCodes] = await Promise.all([
    fetchDisclosures(),
    fetchReadUrls(),
    fetchSavedLaterUrls(),
    fetchBenchmarkCodes(),
  ])
  return (
    <DisclosureClient
      initialDisclosures={disclosures}
      initialReadUrls={readUrls}
      initialSavedLaterUrls={savedLaterUrls}
      benchmarkCodes={benchmarkCodes}
    />
  )
}
