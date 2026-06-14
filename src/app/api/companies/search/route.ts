import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// NFKC正規化：全角英数字→半角、半角カナ→全角カナ
// その後、半角ASCII文字を全角に変換して両パターンを返す
function buildSearchTerms(q: string): { halfWidth: string; fullWidth: string } {
  const halfWidth = q.normalize('NFKC')
  // 半角ASCII (U+0021〜U+007E) → 全角 (U+FF01〜U+FF5E)
  const fullWidth = halfWidth.replace(/[!-~]/g, c =>
    String.fromCharCode(c.charCodeAt(0) + 0xfee0)
  )
  return { halfWidth, fullWidth }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''

  if (q.length < 2) return NextResponse.json([])

  const { halfWidth, fullWidth } = buildSearchTerms(q)

  // 半角・全角どちらでもヒットするよう OR 検索
  const query = supabase.from('companies').select('code, name, market')
  const { data, error } =
    halfWidth === fullWidth
      ? await query.ilike('name', `%${halfWidth}%`).limit(20)
      : await query
          .or(`name.ilike.%${halfWidth}%,name.ilike.%${fullWidth}%`)
          .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
