import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { saveToNotion } from '@/lib/notion'

export async function POST(req: Request) {
  const { title, document_url, company_name, securities_code, pubdate, note, category_tags, importance } =
    await req.json()

  try {
    const { data: item, error: itemError } = await supabase
      .from('items')
      .upsert(
        {
          title,
          url: document_url,
          source_id: null,
          published_at: pubdate ? pubdate.replace(' ', 'T') : null,
          rule_score: 0,
          is_read: false,
          is_saved: true,
        },
        { onConflict: 'url' }
      )
      .select()
      .single()

    if (itemError) throw new Error(itemError.message)

    const page = await saveToNotion({
      title,
      url: document_url,
      categories: category_tags ?? [],
      importance,
      note: note ?? '',
      sourceName: company_name
        ? `${company_name}${securities_code ? `（${securities_code}）` : ''}`
        : '適時開示',
    })
    const notionUrl = (page as { url: string }).url

    await supabase.from('memos').upsert(
      {
        item_id: item.id,
        note,
        category_tags,
        importance,
        company_name,
        securities_code,
        synced_to_notion: true,
        notion_page_url: notionUrl,
      },
      { onConflict: 'item_id' }
    )

    return NextResponse.json({ notionUrl })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
