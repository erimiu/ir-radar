import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('benchmark_companies')
    .select('*')
    .order('securities_code')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const { securities_code, company_name } = await req.json()

  const { data, error } = await supabase
    .from('benchmark_companies')
    .insert({ securities_code: securities_code.trim(), company_name: (company_name ?? '').trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
