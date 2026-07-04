'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { cancelReservation } from '@/app/dashboard/reservations/actions'
import { ReservationStatusBadge } from '@/components/reservations/reservation-status-badge'
import { CheckInOutControl } from '@/components/reservations/check-in-out-control'
import type { Tables } from '@/lib/database.types'

type ReservationRow = Tables<'reservations'> & {
  guests: { first_name: string; last_name: string } | null
  room_types: { name: string } | null
}

export function ReservationsTable({
  reservations,
  canManage,
}: {
  reservations: ReservationRow[]
  canManage: boolean
}) {
  const [isPending, startTransition] = useTransition()

  function handleCancel(id: string) {
    if (!window.confirm('Cancel this reservation?')) return
    startTransition(async () => {
      await cancelReservation(id)
    })
  }

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
          <tr key={r.id}>
            <td className="px-4 py-2 font-medium text-gray-900">
              {r.guests ? `${r.guests.first_name} ${r.guests.last_name}` : '—'}
            </td>
            <td className="px-4 py-2 text-gray-600">{r.room_types?.name || '—'}</td>
            <td className="px-4 py-2 text-gray-600">{r.check_in}</td>
            <td className="px-4 py-2 text-gray-600">{r.check_out}</td>
            <td className="px-4 py-2 text-gray-600">{r.total_amount.toLocaleString()}</td>
            <td className="px-4 py-2">
              <ReservationStatusBadge status={r.status} />
            </td>
            {canManage && (
              <td className="px-4 py-2">
                <div className="flex flex-col gap-1">
                  <Link
                    href={`/dashboard/folios/${r.id}`}
                    className="text-xs font-medium text-blue-700 hover:text-blue-900"
                  >
                    View folio
                  </Link>
                  <CheckInOutControl
                    reservationId={r.id}
                    roomTypeId={r.room_type_id}
                    status={r.status}
                  />
                  {!['cancelled', 'checked_out', 'no_show', 'checked_in'].includes(r.status) && (
                    <button
                      disabled={isPending}
                      onClick={() => handleCancel(r.id)}
                      className="text-left text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </td>
            )}
          </tr>
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