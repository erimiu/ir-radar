import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  const { url, title, pubdate, saved_for_later } = await req.json()

  try {
    const { data: existing } = await supabase
      .from('items')
      .select('id')
      .eq('url', url)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('items')
        .update({ saved_for_later })
        .eq('id', existing.id)

      if (error) throw new Error(error.message)
      return NextResponse.json({ id: existing.id, saved_for_later })
    }

    const { data, error } = await supabase
      .from('items')
      .insert({
        url,
        title,
        source_id: null,
        published_at: pubdate ? pubdate.replace(' ', 'T') : null,
        rule_score: 0,
        is_read: false,
        is_saved: false,
        saved_for_later,
      })
      .select('id')
      .single()

    if (error) throw new Error(error.message)
    return NextResponse.json({ id: data.id, saved_for_later })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
