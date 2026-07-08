'use client'

import { useTransition } from 'react'
import { deleteRatePlan } from '@/app/dashboard/admin/rates/actions'
import type { Tables } from '@/lib/database.types'

type RatePlanWithType = Tables<'rate_plans'> & { room_types: { name: string } | null }

export function RatePlansTable({ ratePlans }: { ratePlans: RatePlanWithType[] }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string) {
    if (!window.confirm('Delete this rate plan?')) return
    startTransition(async () => {
      await deleteRatePlan(id)
    })
  }

  return (
    <table className="w-full overflow-hidden rounded-lg border border-rule bg-white text-sm">
      <thead className="bg-paper-dim text-left text-xs font-medium uppercase text-ink-soft">
        <tr>
          <th className="px-4 py-2">Room Type</th>
          <th className="px-4 py-2">Plan</th>
          <th className="px-4 py-2">Start</th>
          <th className="px-4 py-2">End</th>
          <th className="px-4 py-2">Nightly Rate</th>
          <th className="px-4 py-2"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-rule/60">
        {ratePlans.map((rp) => (
          <tr key={rp.id}>
            <td className="px-4 py-2 text-ink-soft">{rp.room_types?.name || '—'}</td>
            <td className="px-4 py-2 font-medium text-ink">{rp.name}</td>
            <td className="px-4 py-2 text-ink-soft">{rp.start_date}</td>
            <td className="px-4 py-2 text-ink-soft">{rp.end_date}</td>
            <td className="px-4 py-2 text-ink-soft">{rp.nightly_rate.toLocaleString()}</td>
            <td className="px-4 py-2">
              <button
                disabled={isPending}
                onClick={() => handleDelete(rp.id)}
                className="text-xs font-medium text-status-bad hover:text-status-bad disabled:opacity-50"
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
        {ratePlans.length === 0 && (
          <tr>
            <td colSpan={6} className="px-4 py-6 text-center text-ink-soft/60">
              No rate plans — base rates apply everywhere.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}