'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createGroupBooking } from '@/app/dashboard/groups/actions'
import type { Tables } from '@/lib/database.types'

export function NewGroupBookingForm({ roomTypes }: { roomTypes: Tables<'room_types'>[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [rooms, setRooms] = useState<{ roomTypeId: string; quantity: number }[]>([
    { roomTypeId: '', quantity: 1 },
  ])

  function updateRoom(index: number, field: 'roomTypeId' | 'quantity', value: string) {
    setRooms((current) =>
      current.map((r, i) =>
        i === index ? { ...r, [field]: field === 'quantity' ? Number(value) : value } : r
      )
    )
  }

  function addRoomRow() {
    setRooms((current) => [...current, { roomTypeId: '', quantity: 1 }])
  }

  function removeRoomRow(index: number) {
    setRooms((current) => current.filter((_, i) => i !== index))
  }

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      const result = await createGroupBooking({
        name,
        notes,
        checkIn,
        checkOut,
        primaryGuest: { firstName, lastName, email, phone },
        rooms: rooms.filter((r) => r.roomTypeId && r.quantity > 0),
      })
      if (result?.error) {
        setError(result.error)
        return
      }
      router.push(`/dashboard/groups/${result.groupId}`)
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        + New Group Booking
      </button>
    )
  }

  return (
    <div className="mb-6 space-y-4 rounded-lg border border-gray-200 bg-white p-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Group Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Adeyemi Wedding"
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Notes</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Check-in</label>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Check-out</label>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
      </div>
      <p className="text-xs text-gray-500">
        All rooms in this group share the same check-in/check-out dates. Book a separate group
        if any rooms need different dates.
      </p>

      <div className="border-t border-gray-100 pt-3">
        <p className="mb-2 text-xs font-medium text-gray-700">Primary contact</p>
        <div className="grid grid-cols-2 gap-3">
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      <div className="border-t border-gray-100 pt-3">
        <p className="mb-2 text-xs font-medium text-gray-700">Rooms needed</p>
        <div className="space-y-2">
          {rooms.map((room, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={room.roomTypeId}
                onChange={(e) => updateRoom(i, 'roomTypeId', e.target.value)}
                className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              >
                <option value="">Select room type...</option>
                {roomTypes.map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={room.quantity}
                onChange={(e) => updateRoom(i, 'quantity', e.target.value)}
                className="w-20 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
              {rooms.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRoomRow(i)}
                  className="text-xs font-medium text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addRoomRow}
          className="mt-2 text-xs font-medium text-gray-600 hover:text-gray-900"
        >
          + Add another room type
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {isPending ? 'Booking...' : 'Create Group Booking'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}