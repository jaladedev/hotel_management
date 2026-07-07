'use client'

import { useState, useTransition } from 'react'
import { inviteStaffMember } from '@/app/dashboard/admin/actions'

export function InviteStaffForm() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await inviteStaffMember(formData)
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
        + Invite Staff
      </button>
    )
  }

  return (
    <form action={handleSubmit} className="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 p-4">
      <div className="w-full max-w-sm space-y-3 rounded-lg border border-rule bg-white p-5">
        <h3 className="font-display text-lg font-medium text-ink">Invite Staff Member</h3>
        <input
          name="full_name"
          required
          placeholder="Full name"
          className="w-full rounded-md border border-rule px-3 py-1.5 text-sm"
        />
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="w-full rounded-md border border-rule px-3 py-1.5 text-sm"
        />
        <select name="role" required className="w-full rounded-md border border-rule px-3 py-1.5 text-sm">
          <option value="front_desk">Front Desk</option>
          <option value="housekeeping">Housekeeping</option>
          <option value="admin">Admin</option>
        </select>
        <p className="text-xs text-ink-soft">
          They&apos;ll receive an email with a link to set their password and sign in.
        </p>
        {error && <p className="text-sm text-status-bad">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-indigo-700 px-4 py-1.5 text-sm font-medium text-paper hover:bg-indigo-800 disabled:opacity-50"
          >
            {isPending ? 'Sending invite...' : 'Send Invite'}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md px-4 py-1.5 text-sm font-medium text-ink-soft hover:bg-paper-dim"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  )
}