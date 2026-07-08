import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const { category, keyword } = await request.json()
  if (!category || !keyword) {
    return NextResponse.json({ error: 'category and keyword required' }, { status: 400 })
  }
  const { data, error } = await supabase
    .from('theme_filters')
    .insert({ category, keyword, enabled: true })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
