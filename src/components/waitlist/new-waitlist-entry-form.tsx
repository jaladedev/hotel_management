'use client'

import { useState, useTransition } from 'react'
import { addWaitlistEntry } from '@/app/dashboard/waitlist/actions'
import type { Tables } from '@/lib/database.types'

export function NewWaitlistEntryForm({ roomTypes }: { roomTypes: Tables<'room_types'>[] }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await addWaitlistEntry(formData)
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
        + Add to Waitlist
      </button>
    )
  }

  return (
    <form action={handleSubmit} className="mb-6 space-y-3 rounded-lg border border-rule bg-white p-4">
      <div className="grid grid-cols-2 gap-3">
        <input
          name="guest_first_name"
          placeholder="First name"
          required
          className="rounded-md border border-rule px-3 py-1.5 text-sm"
        />
        <input
          name="guest_last_name"
          placeholder="Last name"
          required
          className="rounded-md border border-rule px-3 py-1.5 text-sm"
        />
        <input
          name="guest_email"
          type="email"
          placeholder="Email"
          required
          className="rounded-md border border-rule px-3 py-1.5 text-sm"
        />
        <input
          name="guest_phone"
          placeholder="Phone"
          className="rounded-md border border-rule px-3 py-1.5 text-sm"
        />
        <input
          name="check_in"
          type="date"
          required
          className="rounded-md border border-rule px-3 py-1.5 text-sm"
        />
        <input
          name="check_out"
          type="date"
          required
          className="rounded-md border border-rule px-3 py-1.5 text-sm"
        />
        <select
          name="room_type_id"
          required
          className="col-span-2 rounded-md border border-rule px-3 py-1.5 text-sm"
        >
          <option value="">Select room type...</option>
          {roomTypes.map((rt) => (
            <option key={rt.id} value={rt.id}>
              {rt.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-status-bad">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-indigo-700 px-4 py-1.5 text-sm font-medium text-paper hover:bg-indigo-800 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Add'}
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