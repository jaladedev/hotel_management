import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaff } from '@/lib/get-current-staff'

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>
}) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()
  const params = await searchParams

  let query = supabase
    .from('audit_log')
    .select('*, staff(full_name)')
    .order('created_at', { ascending: false })
    .limit(200)

  if (params.action) {
    query = query.eq('action', params.action)
  }

  const { data: entries } = await query

  return (
    <div>
      <Link href="/dashboard/admin" className="text-xs font-medium text-ink-soft hover:text-indigo-700">
        ← Back to admin
      </Link>
      <h1 className="mb-1 mt-2 font-display text-xl font-medium text-ink">Audit Log</h1>
      <p className="mb-4 text-xs text-ink-soft">
        Covers cash payments, folio manual edits, refunds, security deposit overrides, staff
        reservation edits/cancellations, room out-of-order overrides, hotel settings changes,
        and staff account changes. Not every action in the app is logged here — only the ones
        flagged as needing an audit trail.
      </p>

      <table className="w-full overflow-hidden rounded-lg border border-rule bg-white text-sm">
        <thead className="bg-paper-dim text-left text-xs font-medium uppercase text-ink-soft">
          <tr>
            <th className="px-4 py-2">Time</th>
            <th className="px-4 py-2">Staff</th>
            <th className="px-4 py-2">Action</th>
            <th className="px-4 py-2">Entity</th>
            <th className="px-4 py-2">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule/60">
          {(entries || []).map((e) => (
            <tr key={e.id}>
              <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-ink-soft">
                {new Date(e.created_at).toLocaleString()}
              </td>
              <td className="px-4 py-2 text-ink">{e.staff?.full_name || '—'}</td>
              <td className="px-4 py-2">
                <span className="inline-block rounded-full bg-brass-100 px-2 py-0.5 text-xs font-medium text-brass-700">
                  {e.action.replace(/_/g, ' ')}
                </span>
              </td>
              <td className="px-4 py-2 font-mono text-xs text-ink-soft">
                {e.entity_type}
                {e.entity_id ? `: ${e.entity_id.slice(0, 8)}…` : ''}
              </td>
              <td className="px-4 py-2 font-mono text-xs text-ink-soft">
                {e.details ? JSON.stringify(e.details) : '—'}
              </td>
            </tr>
          ))}
          {(entries || []).length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-ink-soft/60">
                No audit entries yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}