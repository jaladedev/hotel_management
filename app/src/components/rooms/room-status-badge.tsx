import type { Enums } from '@/lib/database.types'

const ROOM_STATUS_STYLES: Record<Enums<'room_status'>, string> = {
  vacant: 'bg-green-100 text-green-800',
  occupied: 'bg-red-100 text-red-800',
  dirty: 'bg-amber-100 text-amber-800',
  clean: 'bg-blue-100 text-blue-800',
  out_of_order: 'bg-gray-200 text-gray-700',
}

export function RoomStatusBadge({ status }: { status: Enums<'room_status'> }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${ROOM_STATUS_STYLES[status]}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  )
}