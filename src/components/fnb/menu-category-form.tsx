'use client'

import { useState, useTransition } from 'react'
import { createMenuCategory } from '@/app/dashboard/fnb/actions'

export function MenuCategoryForm() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createMenuCategory(formData)
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
        className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-paper hover:bg-indigo-800"
      >
        + Add Category
      </button>
    )
  }

  return (
    <form action={handleSubmit} className="flex items-end gap-2 rounded-lg border border-rule bg-white p-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-soft">Name</label>
        <input
          name="name"
          required
          placeholder="e.g. Starters"
          className="rounded-md border border-rule px-3 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-soft">Sort Order</label>
        <input
          name="sort_order"
          type="number"
          defaultValue={0}
          className="w-20 rounded-md border border-rule px-3 py-1.5 text-sm"
        />
      </div>
      {error && <p className="text-xs text-status-bad">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-indigo-700 px-3 py-1.5 text-xs font-medium text-paper hover:bg-indigo-800 disabled:opacity-50"
      >
        {isPending ? 'Saving...' : 'Save'}
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