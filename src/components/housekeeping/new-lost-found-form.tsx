'use client'

import { useState, useTransition } from 'react'
import { createLostFoundItem } from '@/app/dashboard/housekeeping/actions'
import type { Tables } from '@/lib/database.types'

export function NewLostFoundForm({ rooms }: { rooms: Tables<'rooms'>[] }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createLostFoundItem(formData)
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
        + Log Item
      </button>
    )
  }

  return (
    <form action={handleSubmit} className="mb-4 space-y-3 rounded-lg border border-rule bg-white p-4">
      <div className="grid grid-cols-2 gap-3">
        <select name="room_id" className="rounded-md border border-rule px-3 py-1.5 text-sm">
          <option value="">No specific room</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              Room {r.room_number}
            </option>
          ))}
        </select>
        <input
          name="description"
          required
          placeholder="Item description"
          className="rounded-md border border-rule px-3 py-1.5 text-sm"
        />
        <textarea
          name="notes"
          rows={2}
          placeholder="Notes (optional)"
          className="col-span-2 rounded-md border border-rule px-3 py-1.5 text-sm"
        />
      </div>
      {error && <p className="text-sm text-status-bad">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-indigo-700 px-4 py-1.5 text-sm font-medium text-paper hover:bg-indigo-800 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md px-4 py-1.5 text-sm font-medium text-ink-soft hover:bg-paper-dim"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}