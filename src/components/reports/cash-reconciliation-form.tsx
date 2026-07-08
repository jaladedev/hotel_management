'use client'

import { useState, useTransition } from 'react'
import { recordCashReconciliation } from '@/app/dashboard/reports/actions'
import type { Tables } from '@/lib/database.types'

export function CashReconciliationForm({
  date,
  expectedCash,
  existing,
}: {
  date: string
  expectedCash: number
  existing: Tables<'cash_reconciliations'> | null
}) {
  const [isPending, startTransition] = useTransition()
  const [countedCash, setCountedCash] = useState(existing?.counted_cash?.toString() || '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const variance = countedCash ? Number(countedCash) - expectedCash : null

  function handleSubmit(formData: FormData) {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await recordCashReconciliation(formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      setSuccess(true)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-2">
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="expected_cash" value={expectedCash} />

      <p className="text-xs text-ink-soft">
        Expected cash from today&apos;s payments:{' '}
        <span className="font-semibold text-ink">{expectedCash.toLocaleString()}</span>
      </p>

      <div className="flex items-end gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Counted cash</label>
          <input
            name="counted_cash"
            type="number"
            step="0.01"
            required
            value={countedCash}
            onChange={(e) => setCountedCash(e.target.value)}
            className="w-36 rounded-md border border-rule px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Notes</label>
          <input
            name="notes"
            defaultValue={existing?.notes || ''}
            className="w-48 rounded-md border border-rule px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-indigo-700 px-3 py-1.5 text-xs font-medium text-paper hover:bg-indigo-800 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : existing ? 'Update' : 'Record'}
        </button>
      </div>

      {variance !== null && (
        <p
          className={`text-xs font-medium ${
            variance === 0 ? 'text-status-good' : Math.abs(variance) < 100 ? 'text-status-warn' : 'text-status-bad'
          }`}
        >
          Variance: {variance > 0 ? '+' : ''}
          {variance.toLocaleString()}
        </p>
      )}

      {error && <p className="text-xs text-status-bad">{error}</p>}
      {success && <p className="text-xs text-status-good">Reconciliation saved.</p>}
    </form>
  )
}