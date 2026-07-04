import type { Enums } from '@/lib/database.types'

const RESERVATION_STATUS_STYLES: Record<Enums<'reservation_status'>, string> = {
  pending: 'bg-gray-100 text-gray-700',
  confirmed: 'bg-blue-100 text-blue-800',
  checked_in: 'bg-green-100 text-green-800',
  checked_out: 'bg-gray-200 text-gray-600',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-amber-100 text-amber-800',
}

export function ReservationStatusBadge({ status }: { status: Enums<'reservation_status'> }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${RESERVATION_STATUS_STYLES[status]}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  )
}