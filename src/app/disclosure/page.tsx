import DisclosureClient from './DisclosureClient'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export interface TdnetItem {
  id: string
  pubdate: string
  company_code: string
  company_name: string
  title: string
  document_url: string
  markets_string: string
}

export interface ThemedItem extends TdnetItem {
  categories: string[]
}

async function fetchTdnetItemFlags(): Promise<{ readUrls: string[]; savedLaterUrls: string[] }> {
  const { data } = await supabase
    .from('items')
    .select('url, is_read, saved_for_later')
    .is('source_id', null)
    .or('is_read.eq.true,saved_for_later.eq.true')
  const readUrls: string[] = []
  const savedLaterUrls: string[] = []
  for (const i of data ?? []) {
    if (i.is_read) readUrls.push(i.url as string)
    if (i.saved_for_later) savedLaterUrls.push(i.url as string)
  }
  return { readUrls, savedLaterUrls }
}

export default async function DisclosurePage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const { readUrls, savedLaterUrls } = await fetchTdnetItemFlags()
  const initialTab = searchParams.tab === 'later' ? 'later' : 'briefing'
  return (
    <DisclosureClient
      initialReadUrls={readUrls}
      initialSavedLaterUrls={savedLaterUrls}
      initialTab={initialTab}
    />
  )
}
