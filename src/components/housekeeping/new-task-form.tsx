'use client'

import { useState, useTransition } from 'react'
import { createHousekeepingTask } from '@/app/dashboard/housekeeping/actions'
import type { Tables } from '@/lib/database.types'

export function NewTaskForm({
  rooms,
  staffList,
}: {
  rooms: Tables<'rooms'>[]
  staffList: Tables<'staff'>[]
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createHousekeepingTask(formData)
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
        + New Task
      </button>
    )
  }

  return (
    <form action={handleSubmit} className="mb-4 space-y-3 rounded-lg border border-rule bg-white p-4">
      <div className="grid grid-cols-2 gap-3">
        <select name="room_id" required className="rounded-md border border-rule px-3 py-1.5 text-sm">
          <option value="">Select room...</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              Room {r.room_number}
            </option>
          ))}
        </select>
        <select name="task_type" required className="rounded-md border border-rule px-3 py-1.5 text-sm">
          <option value="cleaning">Cleaning</option>
          <option value="inspection">Inspection</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <select name="assigned_to" className="rounded-md border border-rule px-3 py-1.5 text-sm">
          <option value="">Unassigned</option>
          {staffList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </select>
        <input
          name="notes"
          placeholder="Notes (optional)"
          className="rounded-md border border-rule px-3 py-1.5 text-sm"
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