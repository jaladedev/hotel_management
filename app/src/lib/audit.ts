import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/database.types'

// Covers: cash payments, manual folio edits (incidental charges), refunds
// (cash + Paystack initiation), security deposit release/charge overrides,
// and staff-initiated reservation edits/cancellations. NOT every mutation
// in the app writes here — this is scoped to the specific actions flagged
// as needing an audit trail, not a blanket "log everything" system.
export async function logAudit(
  staffId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  details?: Record<string, unknown>
) {
  const supabase = await createClient()
  // Fire-and-forget-ish: log failures are swallowed rather than surfaced,
  // since a logging failure should never block the actual operation that
  // triggered it. Errors are still visible in server logs for debugging.
  const { error } = await supabase.from('audit_log').insert({
    staff_id: staffId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details: (details ?? null) as Json,
  })
  if (error) console.error('Audit log write failed:', error.message)
}