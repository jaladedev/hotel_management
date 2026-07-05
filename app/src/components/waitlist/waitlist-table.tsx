'use client'

import { useTransition } from 'react'
import { promoteWaitlistEntry, cancelWaitlistEntry } from '@/app/dashboard/waitlist/actions'
import type { Tables } from '@/lib/database.types'

type WaitlistEntryWithJoins = Tables<'waitlist_entries'> & {
  guests: { first_name: string; last_name: string; email: string | null; phone: string | null } | null
  room_types: { name: string } | null
}

const STATUS_STYLES: Record<string, string> = {
  waiting: 'bg-gray-100 text-gray-700',
  notified: 'bg-amber-100 text-amber-800',
  promoted: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  expired: 'bg-gray-200 text-gray-500',
}

export function WaitlistTable({ entries }: { entries: WaitlistEntryWithJoins[] }) {
  const [isPending, startTransition] = useTransition()

  function handlePromote(id: string) {
    startTransition(async () => {
      await promoteWaitlistEntry(id)
    })
  }

  function handleCancel(id: string) {
    if (!window.confirm('Remove this entry from the waitlist?')) return
    startTransition(async () => {
      await cancelWaitlistEntry(id)
    })
  }

  return (
    <table className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-sm">
      <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
        <tr>
          <th className="px-4 py-2">Guest</th>
          <th className="px-4 py-2">Room Type</th>
          <th className="px-4 py-2">Dates</th>
          <th className="px-4 py-2">Status</th>
          <th className="px-4 py-2"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {entries.map((e) => (
          <tr key={e.id}>
            <td className="px-4 py-2">
              <p className="font-medium text-gray-900">
                {e.guests?.first_name} {e.guests?.last_name}
              </p>
              <p className="text-xs text-gray-500">
                {e.guests?.email} {e.guests?.phone && `· ${e.guests.phone}`}
              </p>
            </td>
            <td className="px-4 py-2 text-gray-700">{e.room_types?.name || '—'}</td>
            <td className="px-4 py-2 text-gray-600">
              {e.check_in} → {e.check_out}
            </td>
            <td className="px-4 py-2">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[e.status]}`}
              >
                {e.status}
              </span>
            </td>
            <td className="px-4 py-2">
              {['waiting', 'notified'].includes(e.status) && (
                <div className="flex gap-2">
                  <button
                    disabled={isPending}
                    onClick={() => handlePromote(e.id)}
                    className="text-xs font-medium text-green-700 hover:text-green-900 disabled:opacity-50"
                  >
                    Promote to booking
                  </button>
                  <button
                    disabled={isPending}
                    onClick={() => handleCancel(e.id)}
                    className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              )}
            </td>
          </tr>
        ))}
        {entries.length === 0 && (
          <tr>
            <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
              No one on the waitlist.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}