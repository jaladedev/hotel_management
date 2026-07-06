import type { Enums } from '@/lib/database.types'

const LINE_ITEM_STYLES: Record<Enums<'line_item_type'>, string> = {
  room_charge: 'bg-status-neutral-bg text-status-neutral',
  tax: 'bg-status-neutral-bg text-status-neutral',
  incidental: 'bg-status-warn-bg text-status-warn',
  discount: 'bg-brass-100 text-brass-700',
  deposit_booking: 'bg-status-info-bg text-status-info',
  deposit_security: 'bg-indigo-100 text-indigo-700',
  payment: 'bg-status-good-bg text-status-good',
  refund: 'bg-status-bad-bg text-status-bad',
}

export function LineItemTypeBadge({ type }: { type: Enums<'line_item_type'> }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${LINE_ITEM_STYLES[type]}`}
    >
      {type.replace(/_/g, ' ')}
    </span>
  )
}