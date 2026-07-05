'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import {
  cancelReservation,
  checkAvailabilityForEdit,
  updateReservationDetails,
  updateGuestDetails,
  getPriceEstimate,
} from '@/app/dashboard/reservations/actions'
import { ReservationStatusBadge } from '@/components/reservations/reservation-status-badge'
import { CheckInOutControl } from '@/components/reservations/check-in-out-control'
import type { Tables } from '@/lib/database.types'

type ReservationRow = Tables<'reservations'> & {
  guests: { id: string; first_name: string; last_name: string; email: string | null; phone: string | null } | null
  room_types: { name: string } | null
}

export function ReservationRow({
  reservation: r,
  roomTypes,
  canManage,
}: {
  reservation: ReservationRow
  roomTypes: Tables<'room_types'>[]
  canManage: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [roomTypeId, setRoomTypeId] = useState(r.room_type_id)
  const [checkIn, setCheckIn] = useState(r.check_in)
  const [checkOut, setCheckOut] = useState(r.check_out)
  const [availability, setAvailability] = useState<number | null>(null)
  const [priceEstimate, setPriceEstimate] = useState<{
    subtotal: number
    tax: number
    total: number
    nights: number
  } | null>(null)

  const canEdit = ['pending', 'confirmed'].includes(r.status)

  async function refreshAvailability(rt: string, ci: string, co: string) {
    if (!rt || !ci || !co || co <= ci) {
      setAvailability(null)
      setPriceEstimate(null)
      return
    }
    const [availResult, priceResult] = await Promise.all([
      checkAvailabilityForEdit(r.id, rt, ci, co),
      getPriceEstimate(rt, ci, co),
    ])
    setAvailability(availResult.available ?? 0)
    setPriceEstimate(priceResult)
  }

  function handleCancel() {
    if (!window.confirm('Cancel this reservation?')) return
    startTransition(async () => {
      await cancelReservation(r.id)
    })
  }

  function handleSave(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const [reservationResult, guestResult] = await Promise.all([
        updateReservationDetails(r.id, formData),
        r.guests ? updateGuestDetails(r.guests.id, formData) : Promise.resolve({ success: true }),
      ])
      if (reservationResult?.error) {
        setError(reservationResult.error)
        return
      }
      if ('error' in guestResult && guestResult.error) {
        setError(guestResult.error)
        return
      }
      setEditing(false)
    })
  }

  if (editing) {
    return (
      <tr>
        <td colSpan={canManage ? 7 : 6} className="bg-gray-50 px-4 py-3">
          <form action={handleSave} className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Check-in</label>
                <input
                  name="check_in"
                  type="date"
                  required
                  value={checkIn}
                  onChange={(e) => {
                    setCheckIn(e.target.value)
                    refreshAvailability(roomTypeId, e.target.value, checkOut)
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Check-out</label>
                <input
                  name="check_out"
                  type="date"
                  required
                  value={checkOut}
                  onChange={(e) => {
                    setCheckOut(e.target.value)
                    refreshAvailability(roomTypeId, checkIn, e.target.value)
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Room Type</label>
                <select
                  name="room_type_id"
                  required
                  value={roomTypeId}
                  onChange={(e) => {
                    setRoomTypeId(e.target.value)
                    refreshAvailability(e.target.value, checkIn, checkOut)
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                >
                  {roomTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <p className="mb-2 text-xs font-medium text-gray-700">Guest details</p>
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="guest_first_name"
                  placeholder="First name"
                  required
                  defaultValue={r.guests?.first_name}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
                <input
                  name="guest_last_name"
                  placeholder="Last name"
                  required
                  defaultValue={r.guests?.last_name}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
                <input
                  name="guest_email"
                  type="email"
                  placeholder="Email"
                  defaultValue={r.guests?.email || ''}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
                <input
                  name="guest_phone"
                  placeholder="Phone"
                  defaultValue={r.guests?.phone || ''}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
              </div>
            </div>

            {availability !== null && (
              <p className={`text-xs font-medium ${availability > 0 ? 'text-green-700' : 'text-red-700'}`}>
                {availability > 0 ? `${availability} room(s) available` : 'No rooms available'}
              </p>
            )}
            {priceEstimate && priceEstimate.nights > 0 && (
              <div className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-700">
                <p>
                  {priceEstimate.nights} night(s) — subtotal:{' '}
                  <span className="font-medium">{priceEstimate.subtotal.toLocaleString()}</span>
                  {priceEstimate.tax > 0 && (
                    <>
                      {' '}
                      + tax:{' '}
                      <span className="font-medium">{priceEstimate.tax.toLocaleString()}</span>
                    </>
                  )}
                </p>
                <p className="mt-0.5 font-semibold text-gray-900">
                  New total: {priceEstimate.total.toLocaleString()}
                </p>
              </div>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}

            <p className="text-xs text-gray-500">
              Note: changing room type clears the assigned physical room — it will need
              re-assignment at check-in.
            </p>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isPending || (availability !== null && availability <= 0)}
                className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {isPending ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-md px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </form>
        </td>
      </tr>
    )
  }

  return (
    <tr>
      <td className="px-4 py-2 font-medium text-gray-900">
        {r.guests ? `${r.guests.first_name} ${r.guests.last_name}` : '—'}
      </td>
      <td className="px-4 py-2 text-gray-600">{r.room_types?.name || '—'}</td>
      <td className="px-4 py-2 text-gray-600">{r.check_in}</td>
      <td className="px-4 py-2 text-gray-600">{r.check_out}</td>
      <td className="px-4 py-2 text-gray-600">{r.total_amount.toLocaleString()}</td>
      <td className="px-4 py-2">
        <ReservationStatusBadge status={r.status} />
      </td>
      {canManage && (
        <td className="px-4 py-2">
          <div className="flex flex-col gap-1">
            <Link
              href={`/dashboard/folios/${r.id}`}
              className="text-xs font-medium text-blue-700 hover:text-blue-900"
            >
              View folio
            </Link>
            <CheckInOutControl reservationId={r.id} roomTypeId={r.room_type_id} status={r.status} />
            {canEdit && (
              <button
                onClick={() => setEditing(true)}
                className="text-left text-xs font-medium text-gray-600 hover:text-gray-900"
              >
                Edit
              </button>
            )}
            {!['cancelled', 'checked_out', 'no_show', 'checked_in'].includes(r.status) && (
              <button
                disabled={isPending}
                onClick={handleCancel}
                className="text-left text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>
        </td>
      )}
    </tr>
  )
}