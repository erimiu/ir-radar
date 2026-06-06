import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
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
      // checked_at カラムが存在しない場合に備えてフォールバック
      const { error } = await supabase
        .from('items')
        .update({ is_read, checked_at: checkedAt })
        .eq('id', existing.id)

      if (error) {
        const { error: e2 } = await supabase
          .from('items')
          .update({ is_read })
          .eq('id', existing.id)
        if (e2) throw new Error(e2.message)
      }

      revalidatePath('/calendar')
      return NextResponse.json({ id: existing.id, is_read })
    }

    // 新規作成: checked_at 付きで試みて、失敗したらなしで再試行
    const withCheckedAt = await supabase
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

    if (!withCheckedAt.error) {
      revalidatePath('/calendar')
      return NextResponse.json({ id: withCheckedAt.data.id, is_read })
    }

    const withoutCheckedAt = await supabase
      .from('items')
      .insert({
        url,
        title,
        source_id: null,
        published_at: pubdate ? pubdate.replace(' ', 'T') : null,
        rule_score: 0,
        is_read,
        is_saved: false,
      })
      .select('id')
      .single()

    if (withoutCheckedAt.error) throw new Error(withoutCheckedAt.error.message)
    revalidatePath('/calendar')
    return NextResponse.json({ id: withoutCheckedAt.data.id, is_read })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
