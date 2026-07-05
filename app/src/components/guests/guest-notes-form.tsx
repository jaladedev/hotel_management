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
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </form>
    )
  }

  return (
    <div>
      <p className="whitespace-pre-wrap text-sm text-gray-700">
        {notes || <span className="text-gray-400">No preferences or notes recorded.</span>}
      </p>
      <button
        onClick={() => setEditing(true)}
        className="mt-2 text-xs font-medium text-gray-600 hover:text-gray-900"
      >
        Edit
      </button>
    </div>
  )
}