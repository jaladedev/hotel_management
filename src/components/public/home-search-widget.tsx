'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Tables } from '@/lib/database.types'

export function HomeSearchWidget({ roomTypes }: { roomTypes: Tables<'room_types'>[] }) {
  const router = useRouter()
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [roomTypeId, setRoomTypeId] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (roomTypeId) params.set('room_type_id', roomTypeId)
    if (checkIn) params.set('check_in', checkIn)
    if (checkOut) params.set('check_out', checkOut)
    router.push(`/book?${params.toString()}`)
  }

  return (
    <form
      onSubmit={handleSearch}
      className="relative z-10 mx-auto -mb-10 flex max-w-4xl flex-col gap-3 rounded-lg border border-rule bg-white p-4 shadow-xl sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label className="mb-1 block text-xs font-medium text-ink-soft">Check-in</label>
        <input
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className="w-full rounded-md border border-rule px-3 py-2 text-sm text-ink focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div className="flex-1">
        <label className="mb-1 block text-xs font-medium text-ink-soft">Check-out</label>
        <input
          type="date"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          className="w-full rounded-md border border-rule px-3 py-2 text-sm text-ink focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div className="flex-1">
        <label className="mb-1 block text-xs font-medium text-ink-soft">Room Type</label>
        <select
          value={roomTypeId}
          onChange={(e) => setRoomTypeId(e.target.value)}
          className="w-full rounded-md border border-rule px-3 py-2 text-sm text-ink focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Any room type</option>
          {roomTypes.map((rt) => (
            <option key={rt.id} value={rt.id}>
              {rt.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="rounded-md bg-brass-600 px-6 py-2 text-sm font-semibold text-paper hover:bg-brass-700"
      >
        Check Availability
      </button>
    </form>
  )
}