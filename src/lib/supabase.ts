import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | undefined

function getClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _client
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop: string | symbol) {
    const client = getClient()
    const value = client[prop as keyof SupabaseClient]
    return typeof value === 'function' ? (value as Function).bind(client) : value
  },
})
