import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''

  if (q.length < 2) return NextResponse.json([])

  const { data, error } = await supabase
    .from('companies')
    .select('code, name, market')
    .ilike('name', `%${q}%`)
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
