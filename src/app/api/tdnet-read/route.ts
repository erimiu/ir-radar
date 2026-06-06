import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  const { url, title, pubdate, is_read } = await req.json()
  const checkedAt = is_read ? new Date().toISOString() : null

  try {
    const { data: existing } = await supabase
      .from('items')
      .select('id')
      .eq('url', url)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('items')
        .update({ is_read, checked_at: checkedAt })
        .eq('id', existing.id)
      return NextResponse.json({ id: existing.id, is_read })
    }

    const { data, error } = await supabase
      .from('items')
      .insert({
        url,
        title,
        source_id: null,
        published_at: pubdate ? pubdate.replace(' ', 'T') : null,
        rule_score: 0,
        is_read,
        is_saved: false,
        checked_at: checkedAt,
      })
      .select('id')
      .single()

    if (error) throw new Error(error.message)
    return NextResponse.json({ id: data.id, is_read })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
