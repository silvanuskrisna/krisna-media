import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Service role client — bypasses RLS, use only in API routes (never client-side)
export const supabaseService = createClient(supabaseUrl, supabaseServiceKey)