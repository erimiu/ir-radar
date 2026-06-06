import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(Number(searchParams.get('limit') ?? '30'), 100)

  try {
    const res = await fetch(
      `https://webapi.yanoshin.jp/webapi/tdnet/list/recent.json?limit=${limit}`,
      { cache: 'no-store' }
    )
    if (!res.ok) throw new Error('upstream error')
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 })
  }
}
