'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  publicCheckAvailability,
  publicGetPriceEstimate,
  publicCreateReservation,
  publicJoinWaitlist,
} from '@/app/actions/public-booking'
import type { Tables } from '@/lib/database.types'

export function PublicBookingForm({
  roomTypes,
  preselectedRoomTypeId,
  preselectedCheckIn,
  preselectedCheckOut,
}: {
  roomTypes: Tables<'room_types'>[]
  preselectedRoomTypeId?: string
  preselectedCheckIn?: string
  preselectedCheckOut?: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [roomTypeId, setRoomTypeId] = useState(preselectedRoomTypeId || '')
  const [checkIn, setCheckIn] = useState(preselectedCheckIn || '')
  const [checkOut, setCheckOut] = useState(preselectedCheckOut || '')
  const [availability, setAvailability] = useState<number | null>(null)
  const [checking, setChecking] = useState(false)
  const [priceEstimate, setPriceEstimate] = useState<{
    subtotal: number
    tax: number
    total: number
    nights: number
  } | null>(null)

  async function refresh(rt: string, ci: string, co: string) {
    if (!rt || !ci || !co || co <= ci) {
      setAvailability(null)
      setPriceEstimate(null)
      return
    }
    setChecking(true)
    const [availResult, priceResult] = await Promise.all([
      publicCheckAvailability(rt, ci, co),
      publicGetPriceEstimate(rt, ci, co),
    ])
    setChecking(false)
    setAvailability(availResult.available ?? 0)
    setPriceEstimate(priceResult)
  }

  // If arriving from the homepage search widget with dates/room type already
  // filled in, check availability immediately rather than waiting for the
  // guest to touch a field.
  useEffect(() => {
    if (roomTypeId && checkIn && checkOut) {
      refresh(roomTypeId, checkIn, checkOut)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [waitlistJoined, setWaitlistJoined] = useState(false)
  const [waitlistPending, setWaitlistPending] = useState(false)
  const [waitlistError, setWaitlistError] = useState<string | null>(null)

  async function handleJoinWaitlist() {
    setWaitlistError(null)
    setWaitlistPending(true)
    const form = document.getElementById('booking-form') as HTMLFormElement
    const formData = new FormData(form)
    const result = await publicJoinWaitlist(formData)
    setWaitlistPending(false)
    if (result.error) {
      setWaitlistError(result.error)
      return
    }
    setWaitlistJoined(true)
  }

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await publicCreateReservation(formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      router.push(
        `/book/confirmation/${result.reservationId}?email=${encodeURIComponent(
          String(formData.get('guest_email'))
        )}`
      )
    })
  }

  const inputClass =
    'w-full rounded-md border border-rule bg-white px-3 py-2 text-sm text-ink focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'

  return (
    <form id="booking-form" action={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">Check-in</label>
          <input
            name="check_in"
            type="date"
            required
            value={checkIn}
            onChange={(e) => {
              setCheckIn(e.target.value)
              refresh(roomTypeId, e.target.value, checkOut)
            }}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">Check-out</label>
          <input
            name="check_out"
            type="date"
            required
            value={checkOut}
            onChange={(e) => {
              setCheckOut(e.target.value)
              refresh(roomTypeId, checkIn, e.target.value)
            }}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">Room Type</label>
          <select
            name="room_type_id"
            required
            value={roomTypeId}
            onChange={(e) => {
              setRoomTypeId(e.target.value)
              refresh(e.target.value, checkIn, checkOut)
            }}
            className={inputClass}
          >
            <option value="">Select...</option>
            {roomTypes.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {rt.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {checking && <p className="text-sm text-ink-soft">Checking availability...</p>}
      {!checking && availability !== null && (
        <p
          className={`text-sm font-medium ${
            availability > 0 ? 'text-status-good' : 'text-status-bad'
          }`}
        >
          {availability > 0
            ? `${availability} room(s) available`
            : 'No rooms available for those dates'}
        </p>
      )}
      {!checking && availability === 0 && !waitlistJoined && (
        <div className="rounded-md bg-status-warn-bg p-3 text-sm text-status-warn">
          <p className="mb-2">
            Fill in your details below, then join the waitlist — we&apos;ll reach out if a room
            opens up for these dates.
          </p>
          <button
            type="button"
            onClick={handleJoinWaitlist}
            disabled={waitlistPending}
            className="rounded-md bg-brass-600 px-3 py-1.5 text-xs font-medium text-paper hover:bg-brass-700 disabled:opacity-50"
          >
            {waitlistPending ? 'Joining...' : 'Join Waitlist'}
          </button>
          {waitlistError && <p className="mt-2 text-xs text-status-bad">{waitlistError}</p>}
        </div>
      )}
      {waitlistJoined && (
        <p className="text-sm text-status-good">
          You&apos;re on the waitlist — we&apos;ll email you if a room opens up.
        </p>
      )}
      {!checking && priceEstimate && priceEstimate.nights > 0 && (
        <div className="rounded-md border border-rule bg-paper-dim p-4 text-sm">
          <p className="text-ink-soft">
            {priceEstimate.nights} night(s) — subtotal{' '}
            <span className="font-mono">{priceEstimate.subtotal.toLocaleString()}</span>
            {priceEstimate.tax > 0 && (
              <>
                {' '}
                + tax <span className="font-mono">{priceEstimate.tax.toLocaleString()}</span>
              </>
            )}
          </p>
          <p className="mt-1 font-display text-lg font-medium text-ink">
            Total: {priceEstimate.total.toLocaleString()}
          </p>
        </div>
      )}

      <div className="space-y-4 border-t border-rule pt-4">
        <p className="text-sm font-medium text-ink">Your details</p>
        <div className="grid grid-cols-2 gap-4">
          <input name="guest_first_name" placeholder="First name" required className={inputClass} />
          <input name="guest_last_name" placeholder="Last name" required className={inputClass} />
          <input
            name="guest_email"
            type="email"
            placeholder="Email"
            required
            className={`col-span-2 ${inputClass}`}
          />
          <input
            name="guest_phone"
            placeholder="Phone"
            className={`col-span-2 ${inputClass}`}
          />
        </div>
        <p className="text-xs text-ink-soft">
          We&apos;ll use your email to send a confirmation and to look up your booking later.
        </p>
      </div>

      {error && <p className="text-sm text-status-bad">{error}</p>}

      <button
        type="submit"
        disabled={isPending || (availability !== null && availability <= 0)}
        className="w-full rounded-md bg-indigo-700 px-4 py-3 text-sm font-medium text-paper hover:bg-indigo-800 disabled:opacity-50"
      >
        {isPending ? 'Booking...' : 'Confirm Booking'}
      </button>
    </form>
  )
}