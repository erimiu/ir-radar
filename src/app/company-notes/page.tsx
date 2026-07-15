import { supabase } from '@/lib/supabase'
import CompanyNotesClient from './CompanyNotesClient'

export const dynamic = 'force-dynamic'

export interface CompanyNoteItem {
  code: string
  name: string
  market: string | null
  ai_summary: string | null
  my_memo: string | null
  ir_site_url: string | null
  updated_at: string | null
}

export default async function CompanyNotesPage() {
  const { data } = await supabase
    .from('company_notes')
    .select('code, ai_summary, my_memo, ir_site_url, updated_at, companies(name, market)')
    .order('updated_at', { ascending: false })

  const items: CompanyNoteItem[] = (data ?? []).map(n => {
    const co = (n.companies as unknown as { name: string; market: string | null } | null)
    return {
      code: n.code,
      name: co?.name ?? n.code,
      market: co?.market ?? null,
      ai_summary: n.ai_summary ?? null,
      my_memo: n.my_memo ?? null,
      ir_site_url: n.ir_site_url ?? null,
      updated_at: n.updated_at ?? null,
    }
  })

  return <CompanyNotesClient items={items} />
}
