import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  _req: Request,
  { params }: { params: { code: string } }
) {
  const { code } = params

  const [companyResult, notesResult, memosResult] = await Promise.all([
    supabase.from('companies').select('code, name, market').eq('code', code).single(),
    supabase.from('company_notes').select('*').eq('code', code).single(),
    supabase
      .from('memos')
      .select('id, item_id, note, category_tags, importance, created_at, items(title, url)')
      .eq('securities_code', code)
      .eq('synced_to_notion', true)
      .order('created_at', { ascending: false }),
  ])

  return NextResponse.json({
    company: companyResult.data ?? null,
    notes: notesResult.data ?? null,
    memos: memosResult.data ?? [],
  })
}

export async function PATCH(
  req: Request,
  { params }: { params: { code: string } }
) {
  const { code } = params
  const body = await req.json() as { ir_site_url?: string; my_memo?: string }
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('company_notes')
    .upsert(
      { code, ...body, updated_at: now },
      { onConflict: 'code' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
