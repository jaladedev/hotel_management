'use client'

import { useState, useTransition } from 'react'
import { sendPendingWaitlistNotifications } from '@/app/dashboard/waitlist/actions'

export function SendWaitlistNotificationsButton() {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  function handleClick() {
    setMessage(null)
    startTransition(async () => {
      const result = await sendPendingWaitlistNotifications()
      if (result.error) {
        setMessage(result.error)
        return
      }
      setMessage(
        result.count === 0
          ? 'No pending notifications to send.'
          : `Sent ${result.count} notification email(s).`
      )
    })
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="rounded-md bg-brass-600 px-3 py-1.5 text-xs font-medium text-paper hover:bg-brass-700 disabled:opacity-50"
      >
        {isPending ? 'Sending...' : 'Send pending waitlist alerts'}
      </button>
      {message && <p className="text-xs text-ink-soft">{message}</p>}
    </div>
  )
}