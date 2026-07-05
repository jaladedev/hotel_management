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

      <p className="text-xs text-gray-600">
        Expected cash from today&apos;s payments:{' '}
        <span className="font-semibold text-gray-900">{expectedCash.toLocaleString()}</span>
      </p>

      <div className="flex items-end gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Counted cash</label>
          <input
            name="counted_cash"
            type="number"
            step="0.01"
            required
            value={countedCash}
            onChange={(e) => setCountedCash(e.target.value)}
            className="w-36 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Notes</label>
          <input
            name="notes"
            defaultValue={existing?.notes || ''}
            className="w-48 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : existing ? 'Update' : 'Record'}
        </button>
      </div>

      {variance !== null && (
        <p
          className={`text-xs font-medium ${
            variance === 0 ? 'text-green-700' : Math.abs(variance) < 100 ? 'text-amber-700' : 'text-red-700'
          }`}
        >
          Variance: {variance > 0 ? '+' : ''}
          {variance.toLocaleString()}
        </p>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
      {success && <p className="text-xs text-green-700">Reconciliation saved.</p>}
    </form>
  )
}