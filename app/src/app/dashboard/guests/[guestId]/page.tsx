import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GuestNotesForm } from '@/components/guests/guest-notes-form'
import { ReservationStatusBadge } from '@/components/reservations/reservation-status-badge'

export default async function GuestProfilePage({
  params,
}: {
  params: Promise<{ guestId: string }>
}) {
  const supabase = await createClient()
  const { guestId } = await params

  const { data: guest } = await supabase.from('guests').select('*').eq('id', guestId).single()
  if (!guest) notFound()

  const { data: reservations } = await supabase
    .from('reservations')
    .select('*, room_types(name)')
    .eq('guest_id', guestId)
    .order('check_in', { ascending: false })

  const stayCount = (reservations || []).filter((r) => r.status !== 'cancelled').length
  const totalSpent = (reservations || [])
    .filter((r) => ['checked_in', 'checked_out'].includes(r.status))
    .reduce((sum, r) => sum + r.total_amount, 0)

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/guests"
        className="text-xs font-medium text-ink-soft hover:text-indigo-700"
      >
        ← Back to guests
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-display font-medium text-ink">
            {guest.first_name} {guest.last_name}
          </h1>
          <p className="text-sm text-ink-soft">{guest.email || 'No email on file'}</p>
          <p className="text-sm text-ink-soft">{guest.phone || 'No phone on file'}</p>
          {guest.id_type && (
            <p className="mt-1 text-xs text-ink-soft/60">
              {guest.id_type}: {guest.id_number}
            </p>
          )}
        </div>
        {guest.is_repeat_guest && (
          <span className="inline-block rounded-full bg-brass-100 px-3 py-1 text-xs font-medium text-brass-700">
            Repeat guest
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-rule bg-white p-4">
          <p className="text-xs text-ink-soft">Total stays</p>
          <p className="mt-1 text-xl font-display font-medium text-ink">{stayCount}</p>
        </div>
        <div className="rounded-lg border border-rule bg-white p-4">
          <p className="text-xs text-ink-soft">Total spent (completed stays)</p>
          <p className="mt-1 text-xl font-display font-medium text-ink">
            {totalSpent.toLocaleString()}
          </p>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink">Preferences & Notes</h2>
        <div className="rounded-lg border border-rule bg-white p-4">
          <GuestNotesForm guestId={guest.id} notes={guest.notes} />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink">Stay History</h2>
        <table className="w-full overflow-hidden rounded-lg border border-rule bg-white text-sm">
          <thead className="bg-paper-dim text-left text-xs font-medium uppercase text-ink-soft">
            <tr>
              <th className="px-4 py-2">Room Type</th>
              <th className="px-4 py-2">Check-in</th>
              <th className="px-4 py-2">Check-out</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule/60">
            {(reservations || []).map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2 text-ink-soft">{r.room_types?.name || '—'}</td>
                <td className="px-4 py-2 text-ink-soft">{r.check_in}</td>
                <td className="px-4 py-2 text-ink-soft">{r.check_out}</td>
                <td className="px-4 py-2 text-ink-soft">{r.total_amount.toLocaleString()}</td>
                <td className="px-4 py-2">
                  <ReservationStatusBadge status={r.status} />
                </td>
                <td className="px-4 py-2">
                  <Link
                    href={`/dashboard/folios/${r.id}`}
                    className="text-xs font-medium text-indigo-700 hover:text-indigo-800"
                  >
                    View folio
                  </Link>
                </td>
              </tr>
            ))}
            {(reservations || []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink-soft/60">
                  No stays yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}