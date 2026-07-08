import type { Enums } from '@/lib/database.types'

const ROOM_STATUS_STYLES: Record<Enums<'room_status'>, string> = {
  vacant: 'bg-status-good-bg text-status-good',
  occupied: 'bg-status-bad-bg text-status-bad',
  dirty: 'bg-status-warn-bg text-status-warn',
  clean: 'bg-status-info-bg text-status-info',
  out_of_order: 'bg-status-neutral-bg text-status-neutral',
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