import { notFound } from 'next/navigation'
import CompanyClient from './CompanyClient'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export interface CompanyInfo {
  code: string
  name: string
  market: string | null
}

export interface CompanyNotes {
  code: string
  ai_summary: string | null
  ai_generated_at: string | null
  ir_site_url: string | null
  my_memo: string | null
  updated_at: string | null
}

export interface CompanyMemo {
  id: string
  item_id: string
  note: string | null
  category_tags: string[] | null
  importance: string | null
  created_at: string
  items: { title: string; url: string } | null
}

export default async function CompanyPage({
  params,
}: {
  params: { code: string }
}) {
  const code = params.code

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

  if (!companyResult.data) notFound()

  return (
    <CompanyClient
      company={companyResult.data as CompanyInfo}
      initialNotes={(notesResult.data as CompanyNotes) ?? null}
      initialMemos={(memosResult.data as unknown as CompanyMemo[]) ?? []}
    />
  )
}
