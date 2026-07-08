'use client'

import { useState, useTransition } from 'react'
import { updateTableStatus } from '@/app/dashboard/fnb/actions'
import type { Tables } from '@/lib/database.types'

const STATUS_STYLES: Record<string, string> = {
  available: 'bg-status-good-bg border-status-good/30 text-status-good',
  occupied: 'bg-status-bad-bg border-status-bad/30 text-status-bad',
  reserved: 'bg-status-info-bg border-status-info/30 text-status-info',
  cleaning: 'bg-status-warn-bg border-status-warn/30 text-status-warn',
}

const STATUS_OPTIONS = ['available', 'occupied', 'reserved', 'cleaning']

export function TableStatusGrid({ tables }: { tables: Tables<'restaurant_tables'>[] }) {
  const [isPending, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<string | null>(null)

  function handleChange(id: string, status: string) {
    setPendingId(id)
    startTransition(async () => {
      await updateTableStatus(id, status)
      setPendingId(null)
    })
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
      {tables.map((table) => (
        <div
          key={table.id}
          className={`rounded-lg border-2 p-3 transition-opacity ${STATUS_STYLES[table.status]} ${
            isPending && pendingId === table.id ? 'opacity-50' : ''
          }`}
        >
          <p className="text-sm font-semibold">Table {table.table_number}</p>
          <p className="text-xs opacity-80">{table.seats} seats</p>
          <p className="mt-1 text-xs font-medium capitalize">{table.status}</p>
          <select
            defaultValue=""
            disabled={isPending && pendingId === table.id}
            onChange={(e) => {
              if (e.target.value) handleChange(table.id, e.target.value)
              e.target.value = ''
            }}
            className="mt-2 w-full rounded border border-current/30 bg-white/60 px-1 py-0.5 text-[10px]"
          >
            <option value="">Change...</option>
            {STATUS_OPTIONS.filter((s) => s !== table.status).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      ))}
      {tables.length === 0 && <p className="text-ink-soft">No tables set up yet.</p>}
    </div>
  )
}