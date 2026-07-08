'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { closeOrder } from '@/app/dashboard/fnb/actions'

export function CloseOrderPanel({ orderId, isWalkIn }: { orderId: string; isWalkIn: boolean }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [method, setMethod] = useState('cash')

  function handleClose() {
    if (!window.confirm('Close this order? This cannot be undone.')) return
    setError(null)
    const formData = new FormData()
    formData.set('paid_method', method)
    startTransition(async () => {
      const result = await closeOrder(orderId, formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      router.push('/dashboard/fnb/orders')
    })
  }

  return (
    <div className="rounded-lg border border-rule bg-white p-4">
      <p className="mb-2 text-sm font-medium text-ink">
        {isWalkIn ? 'Settle & close order' : 'Close order — posts to guest folio'}
      </p>
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
      <button
        onClick={handleClose}
        disabled={isPending}
        className="rounded-md bg-status-good px-4 py-1.5 text-sm font-medium text-paper hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? 'Closing...' : 'Close Order'}
      </button>
    </div>
  )
}