import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

// DANGER: bypasses RLS entirely. Only use in trusted server-side contexts:
//   - the public booking Route Handler (unauthenticated guests creating reservations)
//   - the Paystack webhook handler (after verifying the signature)
// Never import this in a Client Component or expose the service role key to the browser.
export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}