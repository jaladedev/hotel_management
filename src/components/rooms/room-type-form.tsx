'use client'

import { useState, useTransition } from 'react'
import { createRoomType } from '@/app/dashboard/rooms/actions'

export function RoomTypeForm() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createRoomType(formData)
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
        + Add Room Type
      </button>
    )
  }

  return (
    <form
      action={handleSubmit}
      className="mb-6 space-y-3 rounded-lg border border-rule bg-white p-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Name</label>
          <input
            name="name"
            required
            className="w-full rounded-md border border-rule px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Base Rate</label>
          <input
            name="base_rate"
            type="number"
            step="0.01"
            required
            className="w-full rounded-md border border-rule px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Max Occupancy</label>
          <input
            name="max_occupancy"
            type="number"
            required
            className="w-full rounded-md border border-rule px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">
            Amenities (comma-separated)
          </label>
          <input
            name="amenities"
            placeholder="Wi-Fi, TV, AC"
            className="w-full rounded-md border border-rule px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-ink-soft">Description</label>
        <textarea
          name="description"
          rows={2}
          className="w-full rounded-md border border-rule px-3 py-1.5 text-sm"
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