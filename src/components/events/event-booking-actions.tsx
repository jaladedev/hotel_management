'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { settleEventBooking, cancelEventBooking } from '@/app/dashboard/events/actions'

export function EventBookingActions({
  bookingId,
  isWalkIn,
}: {
  bookingId: string
  isWalkIn: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [method, setMethod] = useState('cash')

  function handleSettle() {
    if (!window.confirm('Settle this event booking?')) return
    setError(null)
    const formData = new FormData()
    formData.set('paid_method', method)
    startTransition(async () => {
      const result = await settleEventBooking(bookingId, formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  function handleCancel() {
    if (!window.confirm('Cancel this event booking?')) return
    setError(null)
    startTransition(async () => {
      const result = await cancelEventBooking(bookingId)
      if (result?.error) {
        setError(result.error)
        return
      }
      router.push('/dashboard/events')
    })
  }

  return (
    <div className="rounded-lg border border-rule bg-white p-4">
      {isWalkIn && (
        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-ink-soft">Payment method</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="rounded-md border border-rule px-3 py-1.5 text-sm"
          >
            <option value="cash">Cash</option>
            <option value="paystack">Paystack (already collected elsewhere)</option>
          </select>
        </div>
      )}

      {error && <p className="mb-2 text-xs text-status-bad">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleSettle}
          disabled={isPending}
          className="rounded-md bg-status-good px-4 py-1.5 text-sm font-medium text-paper hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? 'Settling...' : isWalkIn ? 'Settle & Complete' : 'Complete (post to folio)'}
        </button>
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="rounded-md bg-status-bad px-4 py-1.5 text-sm font-medium text-paper hover:opacity-90 disabled:opacity-50"
        >
          Cancel Booking
        </button>
      </div>
    </div>
  )
}