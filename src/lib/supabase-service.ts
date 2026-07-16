import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

let _client: SupabaseClient | null = null

export function getServiceClient(): SupabaseClient {
  if (!_client) {
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
    }
    _client = createClient(supabaseUrl!, supabaseServiceKey)
  }
  return _client
}

// Lazy-loaded service role client — bypasses RLS, use only in API routes (never client-side)
// Client is initialized on first property access, not at module evaluation time
export const supabaseService = new Proxy<SupabaseClient>({} as SupabaseClient, {
  get(_, prop) {
    return getServiceClient()[prop as keyof SupabaseClient]
  }
})