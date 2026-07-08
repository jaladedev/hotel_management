'use client'

import { useState, useTransition } from 'react'
import { updateGuestNotes } from '@/app/dashboard/guests/actions'

export function GuestNotesForm({ guestId, notes }: { guestId: string; notes: string | null }) {
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSave(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await updateGuestNotes(guestId, formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      setEditing(false)
    })
  }

  if (editing) {
    return (
      <form action={handleSave} className="space-y-2">
        <textarea
          name="notes"
          rows={4}
          defaultValue={notes || ''}
          placeholder="Preferences, allergies, special requests..."
          className="w-full rounded-md border border-rule px-3 py-2 text-sm"
        />
        {error && <p className="text-xs text-status-bad">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-indigo-700 px-3 py-1.5 text-xs font-medium text-paper hover:bg-indigo-800 disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-paper-dim"
          >
            Cancel
          </button>
        </div>
      </form>
    )
  }

  return (
    <div>
      <p className="whitespace-pre-wrap text-sm text-ink-soft">
        {notes || <span className="text-ink-soft/60">No preferences or notes recorded.</span>}
      </p>
      <button
        onClick={() => setEditing(true)}
        className="mt-2 text-xs font-medium text-ink-soft hover:text-ink"
      >
        Edit
      </button>
    </div>
  )
}