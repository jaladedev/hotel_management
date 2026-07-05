'use client'

import { useState, useTransition } from 'react'
import {
  collectSecurityDeposit,
  releaseSecurityDeposit,
  chargeSecurityDeposit,
} from '@/app/dashboard/folios/actions'

export function SecurityDepositPanel({
  folioId,
  status,
  amount,
}: {
  folioId: string
  status: string
  amount: number
}) {
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<'closed' | 'collect' | 'charge'>('closed')
  const [error, setError] = useState<string | null>(null)

  function handleCollect(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await collectSecurityDeposit(folioId, formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      setMode('closed')
    })
  }

  function handleRelease() {
    if (!window.confirm(`Release the ${amount.toLocaleString()} security deposit back to the guest?`)) return
    setError(null)
    startTransition(async () => {
      const result = await releaseSecurityDeposit(folioId)
      if (result?.error) setError(result.error)
    })
  }

  function handleCharge(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await chargeSecurityDeposit(folioId, formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      setMode('closed')
    })
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-2 text-sm font-semibold text-gray-900">Security Deposit</h3>

      {status === 'none' && mode === 'closed' && (
        <button
          onClick={() => setMode('collect')}
          className="rounded-md bg-indigo-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-800"
        >
          Collect Deposit
        </button>
      )}

      {mode === 'collect' && (
        <form action={handleCollect} className="flex items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Amount (cash)</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              required
              autoFocus
              className="w-36 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-indigo-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Confirm'}
          </button>
          <button
            type="button"
            onClick={() => setMode('closed')}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
        </form>
      )}

      {status === 'held' && mode === 'closed' && (
        <div>
          <p className="mb-2 text-sm text-gray-700">
            Holding <span className="font-semibold">{amount.toLocaleString()}</span> in cash.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleRelease}
              disabled={isPending}
              className="rounded-md bg-green-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-800 disabled:opacity-50"
            >
              Release (no damage)
            </button>
            <button
              onClick={() => setMode('charge')}
              disabled={isPending}
              className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-800 disabled:opacity-50"
            >
              Charge for damage
            </button>
          </div>
        </div>
      )}

      {mode === 'charge' && (
        <form action={handleCharge} className="space-y-2">
          <div className="flex items-end gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Description</label>
              <input
                name="description"
                required
                autoFocus
                placeholder="Broken lamp, stained carpet..."
                className="w-48 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Amount</label>
              <input
                name="amount"
                type="number"
                step="0.01"
                required
                className="w-32 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Up to {amount.toLocaleString()} is covered by the held deposit automatically. Any
            amount above that becomes a normal balance the guest still owes.
          </p>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-800 disabled:opacity-50"
            >
              {isPending ? 'Saving...' : 'Confirm charge'}
            </button>
            <button
              type="button"
              onClick={() => setMode('closed')}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {status === 'released' && (
        <p className="text-sm text-green-700">
          Released — {amount.toLocaleString()} returned to guest.
        </p>
      )}
      {status === 'charged' && (
        <p className="text-sm text-red-700">
          Charged for damage — deposit applied to the incidental charge above.
        </p>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}