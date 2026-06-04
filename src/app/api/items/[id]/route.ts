import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from('items')
    .select('*, sources(*)')
    .eq('id', params.id)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { data, error } = await supabase
    .from('items')
    .update(body)
    .eq('id', params.id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
