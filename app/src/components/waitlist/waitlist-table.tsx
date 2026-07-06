'use client'

import { useTransition } from 'react'
import { promoteWaitlistEntry, cancelWaitlistEntry } from '@/app/dashboard/waitlist/actions'
import type { Tables } from '@/lib/database.types'

type WaitlistEntryWithJoins = Tables<'waitlist_entries'> & {
  guests: { first_name: string; last_name: string; email: string | null; phone: string | null } | null
  room_types: { name: string } | null
}

const STATUS_STYLES: Record<string, string> = {
  waiting: 'bg-paper-dim text-ink-soft',
  notified: 'bg-status-warn-bg text-status-warn',
  promoted: 'bg-status-good-bg text-status-good',
  cancelled: 'bg-status-bad-bg text-status-bad',
  expired: 'bg-status-neutral-bg text-ink-soft',
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
    <table className="w-full overflow-hidden rounded-lg border border-rule bg-white text-sm">
      <thead className="bg-paper-dim text-left text-xs font-medium uppercase text-ink-soft">
        <tr>
          <th className="px-4 py-2">Guest</th>
          <th className="px-4 py-2">Room Type</th>
          <th className="px-4 py-2">Dates</th>
          <th className="px-4 py-2">Status</th>
          <th className="px-4 py-2"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-rule/60">
        {entries.map((e) => (
          <tr key={e.id}>
            <td className="px-4 py-2">
              <p className="font-medium text-ink">
                {e.guests?.first_name} {e.guests?.last_name}
              </p>
              <p className="text-xs text-ink-soft">
                {e.guests?.email} {e.guests?.phone && `· ${e.guests.phone}`}
              </p>
            </td>
            <td className="px-4 py-2 text-ink-soft">{e.room_types?.name || '—'}</td>
            <td className="px-4 py-2 text-ink-soft">
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
                    className="text-xs font-medium text-status-good hover:opacity-90 disabled:opacity-50"
                  >
                    Promote to booking
                  </button>
                  <button
                    disabled={isPending}
                    onClick={() => handleCancel(e.id)}
                    className="text-xs font-medium text-status-bad hover:text-status-bad disabled:opacity-50"
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
            <td colSpan={5} className="px-4 py-6 text-center text-ink-soft/60">
              No one on the waitlist.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}