'use client'

import { useState, useTransition } from 'react'
import { recordCashPayment } from '@/app/dashboard/folios/actions'

export function CashPaymentForm({ folioId }: { folioId: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await recordCashPayment(folioId, formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      setOpen(false)
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-status-good px-3 py-1.5 text-xs font-medium text-paper hover:opacity-90"
      >
        + Record Cash Payment
      </button>
    )
  }

  return (
    <form action={handleSubmit} className="flex items-end gap-2 rounded-md border border-rule bg-white p-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-soft">Amount received</label>
        <input
          name="amount"
          type="number"
          step="0.01"
          required
          autoFocus
          className="w-36 rounded-md border border-rule px-3 py-1.5 text-sm"
        />
      </div>
      {error && <p className="text-xs text-status-bad">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-status-good px-3 py-1.5 text-xs font-medium text-paper hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? 'Saving...' : 'Confirm'}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="rounded-md px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-paper-dim"
      >
        Cancel
      </button>
    </form>
  )
}