import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ReservationStatusBadge } from '@/components/reservations/reservation-status-badge'

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const supabase = await createClient()
  const { groupId } = await params

  const { data: group } = await supabase
    .from('group_bookings')
    .select('*, guests(first_name, last_name, email, phone)')
    .eq('id', groupId)
    .single()

  if (!group) notFound()

  const { data: reservations } = await supabase
    .from('reservations')
    .select('*, room_types(name), folios(id)')
    .eq('group_booking_id', groupId)
    .order('check_in')

  // Fetch balances for each member's folio in one go
  const folioIds = (reservations || [])
    .map((r) => r.folios?.id)
    .filter((id): id is string => Boolean(id))

  const { data: balances } = await supabase
    .from('folio_balances')
    .select('*')
    .in('folio_id', folioIds.length > 0 ? folioIds : ['00000000-0000-0000-0000-000000000000'])

  const balanceByFolioId = new Map((balances || []).map((b) => [b.folio_id, b.balance ?? 0]))
  const groupTotalBalance = (reservations || []).reduce((sum, r) => {
    const folioId = r.folios?.id
    return sum + (folioId ? balanceByFolioId.get(folioId) ?? 0 : 0)
  }, 0)

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/groups"
        className="text-xs font-medium text-ink-soft hover:text-indigo-700"
      >
        ← Back to groups
      </Link>

      <div>
        <h1 className="text-xl font-display font-medium text-ink">{group.name}</h1>
        <p className="text-sm text-ink-soft">
          Primary contact: {group.guests?.first_name} {group.guests?.last_name}
          {group.guests?.email && ` — ${group.guests.email}`}
        </p>
        {group.notes && <p className="mt-1 text-sm text-ink-soft">{group.notes}</p>}
      </div>

      <div className="rounded-lg border border-rule bg-white p-4">
        <p className="text-xs text-ink-soft">Combined balance across all rooms</p>
        <p
          className={`mt-1 text-xl font-semibold ${
            groupTotalBalance > 0 ? 'text-status-bad' : 'text-status-good'
          }`}
        >
          {groupTotalBalance.toLocaleString()}
        </p>
        <p className="mt-1 text-xs text-ink-soft/60">
          Each room keeps its own folio — this is a combined view, not a merged bill. Settle
          balances individually from each room&apos;s folio page.
        </p>
      </div>

      <table className="w-full overflow-hidden rounded-lg border border-rule bg-white text-sm">
        <thead className="bg-paper-dim text-left text-xs font-medium uppercase text-ink-soft">
          <tr>
            <th className="px-4 py-2">Room Type</th>
            <th className="px-4 py-2">Check-in</th>
            <th className="px-4 py-2">Check-out</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Balance</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule/60">
          {(reservations || []).map((r) => {
            const folioId = r.folios?.id
            const balance = folioId ? balanceByFolioId.get(folioId) ?? 0 : 0
            return (
              <tr key={r.id}>
                <td className="px-4 py-2 text-ink-soft">{r.room_types?.name || '—'}</td>
                <td className="px-4 py-2 text-ink-soft">{r.check_in}</td>
                <td className="px-4 py-2 text-ink-soft">{r.check_out}</td>
                <td className="px-4 py-2">
                  <ReservationStatusBadge status={r.status} />
                </td>
                <td className={`px-4 py-2 ${balance > 0 ? 'text-status-bad' : 'text-status-good'}`}>
                  {balance.toLocaleString()}
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
            )
          })}
          {(reservations || []).length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-ink-soft/60">
                No rooms in this group.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}