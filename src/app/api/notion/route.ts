import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { saveToNotion } from '@/lib/notion'

export async function POST(req: Request) {
  const { item_id, title, url, categories, importance, note, source_name } = await req.json()

  try {
    const page = await saveToNotion({ title, url, categories, importance, note, sourceName: source_name })
    const notionUrl = (page as { url: string }).url

    await Promise.all([
      supabase.from('items').update({ is_saved: true }).eq('id', item_id),
      supabase.from('memos').upsert(
        { item_id, note, category_tags: categories, importance, synced_to_notion: true, notion_page_url: notionUrl },
        { onConflict: 'item_id' }
      ),
    ])

    return NextResponse.json({ url: notionUrl })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
