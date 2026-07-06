import { ReservationRow } from '@/components/reservations/reservation-row'
import type { Tables } from '@/lib/database.types'

type ReservationWithJoins = Tables<'reservations'> & {
  guests: { id: string; first_name: string; last_name: string; email: string | null; phone: string | null } | null
  room_types: { name: string } | null
}

export function ReservationsTable({
  reservations,
  roomTypes,
  canManage,
}: {
  reservations: ReservationWithJoins[]
  roomTypes: Tables<'room_types'>[]
  canManage: boolean
}) {
  return (
    <table className="w-full overflow-hidden rounded-lg border border-rule bg-white text-sm">
      <thead className="bg-paper-dim text-left text-xs font-medium uppercase text-ink-soft">
        <tr>
          <th className="px-4 py-2">Guest</th>
          <th className="px-4 py-2">Room Type</th>
          <th className="px-4 py-2">Check-in</th>
          <th className="px-4 py-2">Check-out</th>
          <th className="px-4 py-2">Total</th>
          <th className="px-4 py-2">Status</th>
          {canManage && <th className="px-4 py-2">Actions</th>}
        </tr>
      </thead>
      <tbody className="divide-y divide-rule/60">
        {reservations.map((r) => (
          <ReservationRow key={r.id} reservation={r} roomTypes={roomTypes} canManage={canManage} />
        ))}
        {reservations.length === 0 && (
          <tr>
            <td colSpan={canManage ? 7 : 6} className="px-4 py-6 text-center text-ink-soft/60">
              No reservations found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}