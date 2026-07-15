import { supabase } from '@/lib/supabase'
import ConnectionsClient from './ConnectionsClient'

export const dynamic = 'force-dynamic'

export interface ConnectionCard {
  id: string
  title: string
  affiliation: string | null
  where_met: string | null
  expertise: string
  contact: string | null
  memo: string | null
  recorded_on: string
}

export default async function ConnectionsPage() {
  const { data } = await supabase
    .from('record_cards')
    .select('id, title, body, recorded_on')
    .eq('card_type', 'connection')
    .order('recorded_on', { ascending: false })

  const connections: ConnectionCard[] = (data ?? []).map(c => {
    const body = c.body as {
      affiliation?: string
      where_met?: string
      expertise: string
      contact?: string
      memo?: string
    }
    return {
      id: c.id,
      title: c.title,
      affiliation: body.affiliation ?? null,
      where_met: body.where_met ?? null,
      expertise: body.expertise,
      contact: body.contact ?? null,
      memo: body.memo ?? null,
      recorded_on: c.recorded_on as string,
    }
  })

  return <ConnectionsClient connections={connections} />
}
