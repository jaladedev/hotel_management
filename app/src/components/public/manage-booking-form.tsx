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
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Booking reference
          </label>
          <input
            value={reservationId}
            onChange={(e) => setReservationId(e.target.value)}
            required
            placeholder="Paste your booking reference"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Email used to book</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {isPending ? 'Looking up...' : 'Find my booking'}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {reservation && !cancelled && (
        <div className="rounded-lg border border-gray-200 p-5 text-sm">
          <p className="mb-1">
            <span className="font-medium text-gray-700">Room:</span> {reservation.room_types?.name}
          </p>
          <p className="mb-1">
            <span className="font-medium text-gray-700">Check-in:</span> {reservation.check_in}
          </p>
          <p className="mb-1">
            <span className="font-medium text-gray-700">Check-out:</span> {reservation.check_out}
          </p>
          <p className="mb-1">
            <span className="font-medium text-gray-700">Status:</span>{' '}
            <span className="capitalize">{reservation.status.replace(/_/g, ' ')}</span>
          </p>
          <p className="mb-3">
            <span className="font-medium text-gray-700">Total:</span>{' '}
            {reservation.total_amount.toLocaleString()}
          </p>

          {['pending', 'confirmed'].includes(reservation.status) && (
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="rounded-md bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              Cancel this booking
            </button>
          )}
        </div>
      )}

      {cancelled && (
        <p className="text-sm text-green-700">Your booking has been cancelled.</p>
      )}
    </div>
  )
}