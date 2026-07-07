'use client'

import { useState, useTransition } from 'react'
import { updateHotelSettings } from '@/app/dashboard/admin/actions'
import type { Tables } from '@/lib/database.types'

export function HotelSettingsForm({ settings }: { settings: Tables<'hotel_settings'> }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleSubmit(formData: FormData) {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await updateHotelSettings(formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      setSuccess(true)
    })
  }

  return (
    <form action={handleSubmit} className="max-w-lg space-y-3 rounded-lg border border-rule bg-white p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-soft">Hotel Name</label>
        <input
          name="name"
          defaultValue={settings.name}
          required
          className="w-full rounded-md border border-rule px-3 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-soft">Address</label>
        <input
          name="address"
          defaultValue={settings.address || ''}
          className="w-full rounded-md border border-rule px-3 py-1.5 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Phone</label>
          <input
            name="phone"
            defaultValue={settings.phone || ''}
            className="w-full rounded-md border border-rule px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Email</label>
          <input
            name="email"
            type="email"
            defaultValue={settings.email || ''}
            className="w-full rounded-md border border-rule px-3 py-1.5 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-soft">Currency Code</label>
        <input
          name="currency"
          defaultValue={settings.currency}
          className="w-24 rounded-md border border-rule px-3 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-soft">
          Cancellation Policy (shown to guests)
        </label>
        <textarea
          name="cancellation_policy"
          rows={3}
          defaultValue={settings.cancellation_policy || ''}
          className="w-full rounded-md border border-rule px-3 py-1.5 text-sm"
        />
      </div>

      {error && <p className="text-sm text-status-bad">{error}</p>}
      {success && <p className="text-sm text-status-good">Saved.</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-indigo-700 px-4 py-1.5 text-sm font-medium text-paper hover:bg-indigo-800 disabled:opacity-50"
      >
        {isPending ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  )
}