'use client'

import { useState, useTransition } from 'react'
import { updateLostFoundStatus } from '@/app/dashboard/housekeeping/actions'
import type { Tables } from '@/lib/database.types'

type ItemWithRoom = Tables<'lost_found_items'> & { rooms: { room_number: string } | null }

const STATUS_STYLES: Record<string, string> = {
  stored: 'bg-status-info-bg text-status-info',
  returned: 'bg-status-good-bg text-status-good',
  disposed: 'bg-status-neutral-bg text-status-neutral',
}

export function LostFoundTable({ items }: { items: ItemWithRoom[] }) {
  const [isPending, startTransition] = useTransition()
  const [returningId, setReturningId] = useState<string | null>(null)
  const [returnedTo, setReturnedTo] = useState('')

  function handleReturn(itemId: string) {
    startTransition(async () => {
      await updateLostFoundStatus(itemId, 'returned', returnedTo)
      setReturningId(null)
      setReturnedTo('')
    })
  }

  function handleDispose(itemId: string) {
    if (!window.confirm('Mark this item as disposed?')) return
    startTransition(async () => {
      await updateLostFoundStatus(itemId, 'disposed')
    })
  }

  return (
    <table className="w-full overflow-hidden rounded-lg border border-rule bg-white text-sm">
      <thead className="bg-paper-dim text-left text-xs font-medium uppercase text-ink-soft">
        <tr>
          <th className="px-4 py-2">Item</th>
          <th className="px-4 py-2">Room</th>
          <th className="px-4 py-2">Found</th>
          <th className="px-4 py-2">Status</th>
          <th className="px-4 py-2"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-rule/60">
        {items.map((item) => (
          <tr key={item.id}>
            <td className="px-4 py-2 text-ink">
              {item.description}
              {item.notes && <p className="text-xs text-ink-soft">{item.notes}</p>}
              {item.returned_to && (
                <p className="text-xs text-status-good">Returned to: {item.returned_to}</p>
              )}
            </td>
            <td className="px-4 py-2 text-ink-soft">
              {item.rooms?.room_number ? `Room ${item.rooms.room_number}` : '—'}
            </td>
            <td className="px-4 py-2 text-ink-soft">
              {new Date(item.found_at).toLocaleDateString()}
            </td>
            <td className="px-4 py-2">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[item.status]}`}
              >
                {item.status}
              </span>
            </td>
            <td className="px-4 py-2">
              {item.status === 'stored' && (
                <>
                  {returningId === item.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        value={returnedTo}
                        onChange={(e) => setReturnedTo(e.target.value)}
                        placeholder="Returned to..."
                        className="w-32 rounded border border-rule px-2 py-1 text-xs"
                      />
                      <button
                        disabled={isPending}
                        onClick={() => handleReturn(item.id)}
                        className="text-xs font-medium text-status-good hover:opacity-80"
                      >
                        Confirm
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setReturningId(item.id)}
                        className="text-xs font-medium text-status-good hover:opacity-80"
                      >
                        Mark returned
                      </button>
                      <button
                        disabled={isPending}
                        onClick={() => handleDispose(item.id)}
                        className="text-xs font-medium text-status-bad hover:opacity-80"
                      >
                        Dispose
                      </button>
                    </div>
                  )}
                </>
              )}
            </td>
          </tr>
        ))}
        {items.length === 0 && (
          <tr>
            <td colSpan={5} className="px-4 py-6 text-center text-ink-soft/60">
              No items logged.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}