import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { calcRuleScore } from '@/lib/scoring'

export async function GET() {
  const { data, error } = await supabase
    .from('items')
    .select('*, sources(*)')
    .order('rule_score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const body = await req.json()
  const rule_score = calcRuleScore(body.title ?? '')
  const { data, error } = await supabase
    .from('items')
    .insert({ ...body, rule_score })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
