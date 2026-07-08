'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createOrder } from '@/app/dashboard/fnb/actions'
import type { Tables } from '@/lib/database.types'

type ReservationOption = {
  id: string
  guests: { first_name: string; last_name: string } | null
  rooms: { room_number: string } | null
}

export function NewOrderForm({
  tables,
  reservations,
}: {
  tables: Tables<'restaurant_tables'>[]
  reservations: ReservationOption[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [orderType, setOrderType] = useState<'dine_in' | 'room_service'>('dine_in')
  const [tableId, setTableId] = useState('')
  const [reservationId, setReservationId] = useState('')
  const [walkinName, setWalkinName] = useState('')

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      const result = await createOrder({
        orderType,
        tableId: orderType === 'dine_in' ? tableId || undefined : undefined,
        reservationId: reservationId || undefined,
        walkinGuestName: !reservationId ? walkinName : undefined,
      })
      if (result?.error) {
        setError(result.error)
        return
      }
      router.push(`/dashboard/fnb/orders/${result.orderId}`)
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-paper hover:bg-indigo-800"
      >
        + New Order
      </button>
    )
  }

  return (
    <div className="mb-6 space-y-3 rounded-lg border border-rule bg-white p-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOrderType('dine_in')}
          className={`rounded-md px-3 py-1.5 text-xs font-medium ${
            orderType === 'dine_in' ? 'bg-indigo-700 text-paper' : 'bg-paper-dim text-ink-soft'
          }`}
        >
          Dine-in
        </button>
        <button
          type="button"
          onClick={() => setOrderType('room_service')}
          className={`rounded-md px-3 py-1.5 text-xs font-medium ${
            orderType === 'room_service' ? 'bg-indigo-700 text-paper' : 'bg-paper-dim text-ink-soft'
          }`}
        >
          Room service
        </button>
      </div>

      {orderType === 'dine_in' && (
        <select
          value={tableId}
          onChange={(e) => setTableId(e.target.value)}
          className="w-full rounded-md border border-rule px-3 py-1.5 text-sm"
        >
          <option value="">No table (takeaway/bar)</option>
          {tables.map((t) => (
            <option key={t.id} value={t.id}>
              Table {t.table_number}
            </option>
          ))}
        </select>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-ink-soft">
          Link to a checked-in guest (posts to their room folio)
        </label>
        <select
          value={reservationId}
          onChange={(e) => setReservationId(e.target.value)}
          className="w-full rounded-md border border-rule px-3 py-1.5 text-sm"
        >
          <option value="">No guest — walk-in / pay now</option>
          {reservations.map((r) => (
            <option key={r.id} value={r.id}>
              {r.guests?.first_name} {r.guests?.last_name}
              {r.rooms?.room_number ? ` — Room ${r.rooms.room_number}` : ''}
            </option>
          ))}
        </select>
      </div>

      {!reservationId && (
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Walk-in guest name</label>
          <input
            value={walkinName}
            onChange={(e) => setWalkinName(e.target.value)}
            className="w-full rounded-md border border-rule px-3 py-1.5 text-sm"
          />
        </div>
      )}

      {error && <p className="text-sm text-status-bad">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="rounded-md bg-indigo-700 px-4 py-1.5 text-sm font-medium text-paper hover:bg-indigo-800 disabled:opacity-50"
        >
          {isPending ? 'Creating...' : 'Start Order'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md px-4 py-1.5 text-sm font-medium text-ink-soft hover:bg-paper-dim"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}