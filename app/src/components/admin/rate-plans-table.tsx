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
    <table className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-sm">
      <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
        <tr>
          <th className="px-4 py-2">Room Type</th>
          <th className="px-4 py-2">Plan</th>
          <th className="px-4 py-2">Start</th>
          <th className="px-4 py-2">End</th>
          <th className="px-4 py-2">Nightly Rate</th>
          <th className="px-4 py-2"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {ratePlans.map((rp) => (
          <tr key={rp.id}>
            <td className="px-4 py-2 text-gray-700">{rp.room_types?.name || '—'}</td>
            <td className="px-4 py-2 font-medium text-gray-900">{rp.name}</td>
            <td className="px-4 py-2 text-gray-600">{rp.start_date}</td>
            <td className="px-4 py-2 text-gray-600">{rp.end_date}</td>
            <td className="px-4 py-2 text-gray-600">{rp.nightly_rate.toLocaleString()}</td>
            <td className="px-4 py-2">
              <button
                disabled={isPending}
                onClick={() => handleDelete(rp.id)}
                className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
        {ratePlans.length === 0 && (
          <tr>
            <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
              No rate plans — base rates apply everywhere.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}