import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(_req: Request, { params }: { params: { itemId: string } }) {
  const { data, error } = await supabase
    .from('memos')
    .select('*')
    .eq('item_id', params.itemId)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: Request, { params }: { params: { itemId: string } }) {
  const body = await req.json()
  const { data, error } = await supabase
    .from('memos')
    .upsert(
      { ...body, item_id: params.itemId },
      { onConflict: 'item_id' }
    )
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
