import { supabase } from '@/lib/supabase'
import CareerClient from './CareerClient'

export const dynamic = 'force-dynamic'

export interface CareerCard {
  id: string
  title: string
  type: 'experience' | 'goal'
  detail: string | null
  achieved: boolean
  recorded_on: string
}

export default async function CareerPage() {
  const { data } = await supabase
    .from('record_cards')
    .select('id, title, body, recorded_on')
    .eq('card_type', 'career')
    .order('recorded_on', { ascending: false })

  const cards: CareerCard[] = (data ?? []).map(c => {
    const body = c.body as {
      type: 'experience' | 'goal'
      detail?: string
      achieved?: boolean
    }
    return {
      id: c.id,
      title: c.title,
      type: body.type,
      detail: body.detail ?? null,
      achieved: body.achieved ?? false,
      recorded_on: c.recorded_on as string,
    }
  })

  return <CareerClient cards={cards} />
}
