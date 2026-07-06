import type { Enums } from '@/lib/database.types'

const RESERVATION_STATUS_STYLES: Record<Enums<'reservation_status'>, string> = {
  pending: 'bg-status-neutral-bg text-status-neutral',
  confirmed: 'bg-status-info-bg text-status-info',
  checked_in: 'bg-status-good-bg text-status-good',
  checked_out: 'bg-paper-dim text-ink-soft',
  cancelled: 'bg-status-bad-bg text-status-bad',
  no_show: 'bg-status-warn-bg text-status-warn',
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