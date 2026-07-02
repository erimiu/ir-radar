import { NextResponse } from 'next/server'
import * as https from 'https'
import { supabase } from '@/lib/supabase'

function httpsGet(url: string, timeoutMs = 20000): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const location = res.headers.location
        if (location) { resolve(httpsGet(location, timeoutMs)); return }
        reject(new Error('Redirect with no location'))
        return
      }
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return }
      let body = ''
      res.on('data', (chunk: Buffer) => { body += chunk })
      res.on('end', () => resolve(body))
    }).on('error', reject)
    req.setTimeout(timeoutMs, () => req.destroy(new Error(`Timeout after ${timeoutMs}ms`)))
  })
}

interface TdnetRaw {
  id: string
  pubdate: string
  company_code: string
  company_name: string
  title: string
  document_url: string
  markets_string: string
}

async function fetchTdnet(): Promise<TdnetRaw[]> {
  const today = new Date()
  const start = new Date(today)
  start.setDate(start.getDate() - 4)
  const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '')
  const startDate = fmt(start)
  const endDate = fmt(today)

  try {
    const body = await httpsGet(
      `https://webapi.yanoshin.jp/webapi/tdnet/list/${startDate}-${endDate}.json`
    )
    const data = JSON.parse(body)
    if (data.items && Array.isArray(data.items)) {
      return data.items.map((i: { Tdnet: TdnetRaw }) => i.Tdnet)
    }
    throw new Error('items missing')
  } catch {
    const body = await httpsGet(
      `https://webapi.yanoshin.jp/webapi/tdnet/list/recent.json?limit=500`
    )
    const data = JSON.parse(body)
    if (data.items && Array.isArray(data.items)) {
      const filtered = data.items.filter((i: { Tdnet: TdnetRaw }) => {
        const ymd = i.Tdnet.pubdate.slice(0, 10).replace(/-/g, '')
        return ymd >= startDate && ymd <= endDate
      })
      return filtered.map((i: { Tdnet: TdnetRaw }) => i.Tdnet)
    }
    throw new Error('items missing in fallback')
  }
}

export async function GET() {
  let items: TdnetRaw[]
  try {
    items = await fetchTdnet()
  } catch {
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 })
  }

  const [{ data: benchmarkData }, { data: filterData }] = await Promise.all([
    supabase.from('benchmark_companies').select('securities_code'),
    supabase.from('theme_filters').select('category, keyword').eq('enabled', true),
  ])

  const benchmarkSet = new Set(
    (benchmarkData ?? []).map(b => b.securities_code as string)
  )
  const filters = (filterData ?? []) as { category: string; keyword: string }[]

  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const yesterdayStr = new Date(today.getTime() - 86400000).toISOString().slice(0, 10)

  // Section A: ベンチマーク企業、直近5日
  const benchmark = items.filter(i => benchmarkSet.has(i.company_code.slice(0, 4)))

  // Section B: テーマ合致、直近2日
  const twoDay = items.filter(i => {
    const d = i.pubdate.slice(0, 10)
    return d === todayStr || d === yesterdayStr
  })

  const themedMap = new Map<string, TdnetRaw & { categories: string[] }>()
  for (const item of twoDay) {
    const matched: string[] = []
    for (const f of filters) {
      if (item.title.includes(f.keyword) && !matched.includes(f.category)) {
        matched.push(f.category)
      }
    }
    if (matched.length > 0) {
      themedMap.set(item.id, { ...item, categories: matched })
    }
  }

  return NextResponse.json({
    benchmark,
    themed: Array.from(themedMap.values()),
  })
}
