import { supabase } from '@/lib/supabase'
import SourcesClient from './SourcesClient'

export const dynamic = 'force-dynamic'

export default async function SourcesPage() {
  const { data } = await supabase
    .from('sources')
    .select('*')
    .order('tier', { ascending: true })
    .order('name', { ascending: true })

  return <SourcesClient initialSources={data ?? []} />
}
