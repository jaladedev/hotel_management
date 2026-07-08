'use client'

import { useState, useTransition } from 'react'
import { publicLookupReservation, publicCancelReservation } from '@/app/actions/public-booking'

type LookedUpReservation = {
  id: string
  check_in: string
  check_out: string
  status: string
  total_amount: number
  room_types: { name: string } | null
  guests: { first_name: string; last_name: string; email: string } | null
}

export function ManageBookingForm() {
  const [isPending, startTransition] = useTransition()
  const [reservationId, setReservationId] = useState('')
  const [email, setEmail] = useState('')
  const [reservation, setReservation] = useState<LookedUpReservation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cancelled, setCancelled] = useState(false)

  const inputClass =
    'w-full rounded-md border border-rule bg-white px-3 py-2 text-sm text-ink focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'

  function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setReservation(null)
    startTransition(async () => {
      const result = await publicLookupReservation(reservationId.trim(), email.trim())
      if (result.error || !result.reservation) {
        setError(result.error || 'Booking not found.')
        return
      }
      setReservation(result.reservation as LookedUpReservation)
    })
  }

  function handleCancel() {
    if (!window.confirm('Cancel this booking? This cannot be undone.')) return
    setError(null)
    startTransition(async () => {
      const result = await publicCancelReservation(reservationId.trim(), email.trim())
      if (result?.error) {
        setError(result.error)
        return
      }
      setCancelled(true)
    })
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleLookup} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">
            Booking reference
          </label>
          <input
            value={reservationId}
            onChange={(e) => setReservationId(e.target.value)}
            required
            placeholder="Paste your booking reference"
            className={`${inputClass} font-mono`}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">
            Email used to book
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-paper hover:bg-indigo-800 disabled:opacity-50"
        >
          {isPending ? 'Looking up...' : 'Find my booking'}
        </button>
      </form>

      {error && <p className="text-sm text-status-bad">{error}</p>}

      {reservation && !cancelled && (
        <div className="rounded-lg border border-rule bg-white p-5 text-sm">
          <p className="mb-1">
            <span className="font-medium text-ink-soft">Room:</span> {reservation.room_types?.name}
          </p>
          <p className="mb-1">
            <span className="font-medium text-ink-soft">Check-in:</span>{' '}
            <span className="font-mono">{reservation.check_in}</span>
          </p>
          <p className="mb-1">
            <span className="font-medium text-ink-soft">Check-out:</span>{' '}
            <span className="font-mono">{reservation.check_out}</span>
          </p>
          <p className="mb-1">
            <span className="font-medium text-ink-soft">Status:</span>{' '}
            <span className="capitalize">{reservation.status.replace(/_/g, ' ')}</span>
          </p>
          <p className="mb-3">
            <span className="font-medium text-ink-soft">Total:</span>{' '}
            <span className="font-mono">{reservation.total_amount.toLocaleString()}</span>
          </p>

          {['pending', 'confirmed'].includes(reservation.status) && (
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="rounded-md bg-status-bad px-4 py-2 text-xs font-medium text-paper hover:opacity-90 disabled:opacity-50"
            >
              Cancel this booking
            </button>
          )}
        </div>
      )}

      {cancelled && (
        <p className="text-sm text-status-good">Your booking has been cancelled.</p>
      )}
    </div>
  )
}