'use client'

import { useState, useTransition } from 'react'
import { createRoom } from '@/app/dashboard/rooms/actions'
import type { Tables } from '@/lib/database.types'

export function RoomForm({ roomTypes }: { roomTypes: Tables<'room_types'>[] }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createRoom(formData)
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
        + Add Room
      </button>
    )
  }

  return (
    <form
      action={handleSubmit}
      className="mb-6 space-y-3 rounded-lg border border-rule bg-white p-4"
    >
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Room Number</label>
          <input
            name="room_number"
            required
            className="w-full rounded-md border border-rule px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Floor</label>
          <input
            name="floor"
            className="w-full rounded-md border border-rule px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Room Type</label>
          <select
            name="room_type_id"
            required
            className="w-full rounded-md border border-rule px-3 py-1.5 text-sm"
          >
            <option value="">Select...</option>
            {roomTypes.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {rt.name}
              </option>
            ))}
          </select>
        </div>
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