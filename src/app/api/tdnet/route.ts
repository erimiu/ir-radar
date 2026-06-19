import { NextResponse } from 'next/server'
import * as https from 'https'

function httpsGet(url: string, timeoutMs = 20000): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const location = res.headers.location
        if (location) {
          resolve(httpsGet(location, timeoutMs))
        } else {
          reject(new Error('Redirect with no location'))
        }
        return
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`))
        return
      }
      let body = ''
      res.on('data', (chunk: Buffer) => { body += chunk })
      res.on('end', () => resolve(body))
    }).on('error', reject)
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Timeout after ${timeoutMs}ms`))
    })
  })
}

function getDateRange() {
  const today = new Date()
  const start = new Date(today)
  start.setDate(start.getDate() - 4)
  const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '')
  return { startDate: fmt(start), endDate: fmt(today) }
}

export async function GET() {
  const { startDate, endDate } = getDateRange()

  // 日付範囲エンドポイントを試みる（タイムアウト20秒）
  try {
    console.log(`[TDnet] Fetching date-range: ${startDate}-${endDate}`)
    const t0 = Date.now()
    const body = await httpsGet(
      `https://webapi.yanoshin.jp/webapi/tdnet/list/${startDate}-${endDate}.json`
    )
    console.log(`[TDnet] date-range OK in ${Date.now() - t0}ms`)
    const data = JSON.parse(body)
    if (data.items && Array.isArray(data.items)) {
      return NextResponse.json(data)
    }
    throw new Error('items missing')
  } catch (e1) {
    console.error('[TDnet] date-range failed:', (e1 as Error).message, '— trying recent fallback')
  }

  // フォールバック: recent.json（タイムアウト20秒）
  try {
    console.log('[TDnet] Fetching recent fallback (limit=500)')
    const t0 = Date.now()
    const body = await httpsGet(
      `https://webapi.yanoshin.jp/webapi/tdnet/list/recent.json?limit=500`,
      20000
    )
    console.log(`[TDnet] recent OK in ${Date.now() - t0}ms`)
    const data = JSON.parse(body)
    if (data.items && Array.isArray(data.items)) {
      // 直近5日間にフィルタリング
      const filtered = data.items.filter((item: { Tdnet: { pubdate: string } }) => {
        const ymd = item.Tdnet.pubdate.slice(0, 10).replace(/-/g, '')
        return ymd >= startDate && ymd <= endDate
      })
      return NextResponse.json({ ...data, items: filtered })
    }
    throw new Error('items missing in recent')
  } catch (e2) {
    console.error('[TDnet] recent fallback failed:', (e2 as Error).message)
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 })
  }
}
