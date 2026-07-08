'use client'

import { useState, useTransition } from 'react'
import { checkAvailability, createReservationAction, getPriceEstimate } from '@/app/dashboard/reservations/actions'
import type { Tables } from '@/lib/database.types'

export function NewReservationForm({ roomTypes }: { roomTypes: Tables<'room_types'>[] }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [roomTypeId, setRoomTypeId] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [availability, setAvailability] = useState<number | null>(null)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [priceEstimate, setPriceEstimate] = useState<{
    subtotal: number
    tax: number
    total: number
    nights: number
  } | null>(null)

  async function refreshAvailability(rt: string, ci: string, co: string) {
    if (!rt || !ci || !co || co <= ci) {
      setAvailability(null)
      setPriceEstimate(null)
      return
    }
    setCheckingAvailability(true)
    const [availResult, priceResult] = await Promise.all([
      checkAvailability(rt, ci, co),
      getPriceEstimate(rt, ci, co),
    ])
    setCheckingAvailability(false)
    setAvailability(availResult.available ?? 0)
    setPriceEstimate(priceResult)
  }

  function handleFieldChange(field: 'roomTypeId' | 'checkIn' | 'checkOut', value: string) {
    const next = {
      roomTypeId: field === 'roomTypeId' ? value : roomTypeId,
      checkIn: field === 'checkIn' ? value : checkIn,
      checkOut: field === 'checkOut' ? value : checkOut,
    }
    if (field === 'roomTypeId') setRoomTypeId(value)
    if (field === 'checkIn') setCheckIn(value)
    if (field === 'checkOut') setCheckOut(value)
    refreshAvailability(next.roomTypeId, next.checkIn, next.checkOut)
  }

  function handleSubmit(formData: FormData) {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await createReservationAction(formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      setSuccess(true)
      setAvailability(null)
      setPriceEstimate(null)
      setRoomTypeId('')
      setCheckIn('')
      setCheckOut('')
      setTimeout(() => setOpen(false), 1200)
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-paper hover:bg-indigo-800"
      >
        + New Reservation
      </button>
    )
  }

  return (
    <form
      action={handleSubmit}
      className="mb-6 space-y-4 rounded-lg border border-rule bg-white p-4"
    >
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Check-in</label>
          <input
            name="check_in"
            type="date"
            required
            value={checkIn}
            onChange={(e) => handleFieldChange('checkIn', e.target.value)}
            className="w-full rounded-md border border-rule px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Check-out</label>
          <input
            name="check_out"
            type="date"
            required
            value={checkOut}
            onChange={(e) => handleFieldChange('checkOut', e.target.value)}
            className="w-full rounded-md border border-rule px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Room Type</label>
          <select
            name="room_type_id"
            required
            value={roomTypeId}
            onChange={(e) => handleFieldChange('roomTypeId', e.target.value)}
            className="w-full rounded-md border border-rule px-3 py-1.5 text-sm"
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

      {checkingAvailability && <p className="text-xs text-ink-soft">Checking availability...</p>}
      {!checkingAvailability && availability !== null && (
        <p className={`text-xs font-medium ${availability > 0 ? 'text-status-good' : 'text-status-bad'}`}>
          {availability > 0
            ? `${availability} room(s) available for these dates`
            : 'No rooms available for these dates'}
        </p>
      )}
      {!checkingAvailability && priceEstimate && priceEstimate.nights > 0 && (
        <div className="rounded-md bg-paper-dim px-3 py-2 text-xs text-ink-soft">
          <p>
            {priceEstimate.nights} night(s) — room subtotal:{' '}
            <span className="font-medium">{priceEstimate.subtotal.toLocaleString()}</span>
            {priceEstimate.tax > 0 && (
              <>
                {' '}
                + tax: <span className="font-medium">{priceEstimate.tax.toLocaleString()}</span>
              </>
            )}
          </p>
          <p className="mt-0.5 font-semibold text-ink">
            Total: {priceEstimate.total.toLocaleString()}
          </p>
          <p className="mt-0.5 text-[10px] text-ink-soft/60">
            Reflects any active rate plan for these dates — not just the base rate.
          </p>
        </div>
      )}

      <div className="border-t border-rule pt-3">
        <p className="mb-2 text-xs font-medium text-ink-soft">Guest details</p>
        <div className="grid grid-cols-2 gap-3">
          <input
            name="guest_first_name"
            placeholder="First name"
            required
            className="rounded-md border border-rule px-3 py-1.5 text-sm"
          />
          <input
            name="guest_last_name"
            placeholder="Last name"
            required
            className="rounded-md border border-rule px-3 py-1.5 text-sm"
          />
          <input
            name="guest_email"
            type="email"
            placeholder="Email (used to match repeat guests)"
            className="rounded-md border border-rule px-3 py-1.5 text-sm"
          />
          <input
            name="guest_phone"
            placeholder="Phone"
            className="rounded-md border border-rule px-3 py-1.5 text-sm"
          />
          <input
            name="guest_id_type"
            placeholder="ID type (passport, national_id...)"
            className="rounded-md border border-rule px-3 py-1.5 text-sm"
          />
          <input
            name="guest_id_number"
            placeholder="ID number"
            className="rounded-md border border-rule px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      {error && <p className="text-sm text-status-bad">{error}</p>}
      {success && <p className="text-sm text-status-good">Reservation created.</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending || (availability !== null && availability <= 0)}
          className="rounded-md bg-indigo-700 px-4 py-1.5 text-sm font-medium text-paper hover:bg-indigo-800 disabled:opacity-50"
        >
          {isPending ? 'Booking...' : 'Book Reservation'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md px-4 py-1.5 text-sm font-medium text-ink-soft hover:bg-paper-dim"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}