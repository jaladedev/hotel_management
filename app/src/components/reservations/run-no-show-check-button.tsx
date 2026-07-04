'use client'

import { useState, useTransition } from 'react'
import { runNoShowCheck } from '@/app/dashboard/reservations/actions'

export function RunNoShowCheckButton() {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  function handleClick() {
    setMessage(null)
    startTransition(async () => {
      const result = await runNoShowCheck()
      if (result.error) {
        setMessage(result.error)
        return
      }
      setMessage(
        result.count === 0
          ? 'No overdue reservations found.'
          : `Marked ${result.count} reservation(s) as no-show.`
      )
    })
  }
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
      >
        {isPending ? 'Checking...' : 'Run no-show check'}
      </button>
      {message && <p className="text-xs text-gray-600">{message}</p>}
    </div>
  )
}