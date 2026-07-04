import type { Enums } from '@/lib/database.types'

const LINE_ITEM_STYLES: Record<Enums<'line_item_type'>, string> = {
  room_charge: 'bg-slate-100 text-slate-700',
  tax: 'bg-slate-100 text-slate-700',
  incidental: 'bg-amber-100 text-amber-800',
  discount: 'bg-purple-100 text-purple-800',
  deposit_booking: 'bg-blue-100 text-blue-800',
  deposit_security: 'bg-indigo-100 text-indigo-800',
  payment: 'bg-green-100 text-green-800',
  refund: 'bg-red-100 text-red-800',
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