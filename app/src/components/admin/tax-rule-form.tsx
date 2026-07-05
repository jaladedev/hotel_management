'use client'

import { useState, useTransition } from 'react'
import { createTaxRule } from '@/app/dashboard/admin/rates/actions'

export function TaxRuleForm() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createTaxRule(formData)
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
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        + Add Tax Rule
      </button>
    )
  }

  return (
    <form action={handleSubmit} className="mb-6 space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Name</label>
          <input
            name="name"
            required
            placeholder="e.g. VAT"
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Rate (%)</label>
          <input
            name="rate_percent"
            type="number"
            step="0.01"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs text-gray-700">
        <input name="is_inclusive" type="checkbox" />
        Already included in nightly rate (inclusive — won&apos;t be charged separately)
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}