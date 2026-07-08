'use client'

import { useState, useTransition } from 'react'
import { addIncidentalCharge } from '@/app/dashboard/folios/actions'

export function IncidentalChargeForm({ folioId }: { folioId: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await addIncidentalCharge(folioId, formData)
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
        className="rounded-md bg-brass-600 px-3 py-1.5 text-xs font-medium text-paper hover:bg-brass-700"
      >
        + Add Charge
      </button>
    )
  }

  return (
    <form action={handleSubmit} className="flex items-end gap-2 rounded-md border border-rule bg-white p-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-soft">Description</label>
        <input
          name="description"
          required
          autoFocus
          placeholder="Minibar, late checkout..."
          className="w-48 rounded-md border border-rule px-3 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-soft">Amount</label>
        <input
          name="amount"
          type="number"
          step="0.01"
          required
          className="w-32 rounded-md border border-rule px-3 py-1.5 text-sm"
        />
      </div>
      {error && <p className="text-xs text-status-bad">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-brass-600 px-3 py-1.5 text-xs font-medium text-paper hover:bg-brass-700 disabled:opacity-50"
      >
        {isPending ? 'Saving...' : 'Add'}
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