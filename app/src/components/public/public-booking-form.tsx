'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  publicCheckAvailability,
  publicGetPriceEstimate,
  publicCreateReservation,
} from '@/app/actions/public-booking'
import type { Tables } from '@/lib/database.types'

export function PublicBookingForm({
  roomTypes,
  preselectedRoomTypeId,
}: {
  roomTypes: Tables<'room_types'>[]
  preselectedRoomTypeId?: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [roomTypeId, setRoomTypeId] = useState(preselectedRoomTypeId || '')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
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

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Check-in</label>
          <input
            name="check_in"
            type="date"
            required
            value={checkIn}
            onChange={(e) => {
              setCheckIn(e.target.value)
              refresh(roomTypeId, e.target.value, checkOut)
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Check-out</label>
          <input
            name="check_out"
            type="date"
            required
            value={checkOut}
            onChange={(e) => {
              setCheckOut(e.target.value)
              refresh(roomTypeId, checkIn, e.target.value)
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Room Type</label>
          <select
            name="room_type_id"
            required
            value={roomTypeId}
            onChange={(e) => {
              setRoomTypeId(e.target.value)
              refresh(e.target.value, checkIn, checkOut)
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
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

      {checking && <p className="text-sm text-gray-500">Checking availability...</p>}
      {!checking && availability !== null && (
        <p className={`text-sm font-medium ${availability > 0 ? 'text-green-700' : 'text-red-700'}`}>
          {availability > 0 ? `${availability} room(s) available` : 'No rooms available for those dates'}
        </p>
      )}
      {!checking && priceEstimate && priceEstimate.nights > 0 && (
        <div className="rounded-md bg-gray-50 p-4 text-sm">
          <p className="text-gray-600">
            {priceEstimate.nights} night(s) — subtotal {priceEstimate.subtotal.toLocaleString()}
            {priceEstimate.tax > 0 && ` + tax ${priceEstimate.tax.toLocaleString()}`}
          </p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            Total: {priceEstimate.total.toLocaleString()}
          </p>
        </div>
      )}

      <div className="space-y-4 border-t border-gray-100 pt-4">
        <p className="text-sm font-medium text-gray-900">Your details</p>
        <div className="grid grid-cols-2 gap-4">
          <input
            name="guest_first_name"
            placeholder="First name"
            required
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            name="guest_last_name"
            placeholder="Last name"
            required
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            name="guest_email"
            type="email"
            placeholder="Email"
            required
            className="col-span-2 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            name="guest_phone"
            placeholder="Phone"
            className="col-span-2 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <p className="text-xs text-gray-500">
          We&apos;ll use your email to send a confirmation and to look up your booking later.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending || (availability !== null && availability <= 0)}
        className="w-full rounded-md bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {isPending ? 'Booking...' : 'Confirm Booking'}
      </button>
    </form>
  )
}