import { ReservationRow } from '@/components/reservations/reservation-row'
import type { Tables } from '@/lib/database.types'

type ReservationWithJoins = Tables<'reservations'> & {
  guests: { first_name: string; last_name: string } | null
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
    <table className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-sm">
      <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
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
      <tbody className="divide-y divide-gray-100">
        {reservations.map((r) => (
          <ReservationRow key={r.id} reservation={r} roomTypes={roomTypes} canManage={canManage} />
        ))}
        {reservations.length === 0 && (
          <tr>
            <td colSpan={canManage ? 7 : 6} className="px-4 py-6 text-center text-gray-400">
              No reservations found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}