import { NextResponse } from 'next/server'
import * as https from 'https'

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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(Number(searchParams.get('limit') ?? '30'), 100)

  try {
    const body = await httpsGet(
      `https://webapi.yanoshin.jp/webapi/tdnet/list/recent.json?limit=${limit}`
    )
    const data = JSON.parse(body)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 })
  }
}
