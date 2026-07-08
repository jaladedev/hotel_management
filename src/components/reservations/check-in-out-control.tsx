'use client'

import { useState, useTransition } from 'react'
import {
  getAvailableRoomsForCheckIn,
  checkInReservation,
  getFolioBalance,
  checkOutReservation,
} from '@/app/dashboard/reservations/actions'

type AvailableRoom = { id: string; room_number: string; status: string }

export function CheckInOutControl({
  reservationId,
  roomTypeId,
  status,
}: {
  reservationId: string
  roomTypeId: string
  status: string
}) {
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<'closed' | 'check_in' | 'check_out'>('closed')
  const [error, setError] = useState<string | null>(null)

  const [rooms, setRooms] = useState<AvailableRoom[]>([])
  const [selectedRoom, setSelectedRoom] = useState('')
  const [loadingRooms, setLoadingRooms] = useState(false)

  const [balance, setBalance] = useState<number | null>(null)
  const [loadingBalance, setLoadingBalance] = useState(false)

  async function openCheckIn() {
    setError(null)
    setMode('check_in')
    setLoadingRooms(true)
    const result = await getAvailableRoomsForCheckIn(roomTypeId)
    setLoadingRooms(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setRooms(result.rooms)
  }

  async function openCheckOut() {
    setError(null)
    setMode('check_out')
    setLoadingBalance(true)
    const result = await getFolioBalance(reservationId)
    setLoadingBalance(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setBalance(result.balance ?? 0)
  }

  function handleCheckIn() {
    if (!selectedRoom) {
      setError('Select a room first.')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await checkInReservation(reservationId, selectedRoom)
      if (result.error) {
        setError(result.error)
        return
      }
      setMode('closed')
    })
  }

  function handleCheckOut() {
    setError(null)
    startTransition(async () => {
      const result = await checkOutReservation(reservationId)
      if (result.error) {
        setError(result.error)
        return
      }
      setMode('closed')
    })
  }

  if (mode === 'check_in') {
    return (
      <div className="space-y-1.5">
        {loadingRooms ? (
          <p className="text-xs text-ink-soft">Loading rooms...</p>
        ) : (
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="rounded-md border border-rule px-2 py-1 text-xs"
          >
            <option value="">Assign room...</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.room_number} ({r.status})
              </option>
            ))}
          </select>
        )}
        {error && <p className="text-xs text-status-bad">{error}</p>}
        <div className="flex gap-2">
          <button
            disabled={isPending || !selectedRoom}
            onClick={handleCheckIn}
            className="text-xs font-medium text-status-good hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? 'Checking in...' : 'Confirm check-in'}
          </button>
          <button
            onClick={() => setMode('closed')}
            className="text-xs font-medium text-ink-soft hover:text-indigo-700"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'check_out') {
    return (
      <div className="space-y-1.5">
        {loadingBalance ? (
          <p className="text-xs text-ink-soft">Loading balance...</p>
        ) : (
          <p className={`text-xs font-medium ${(balance ?? 0) > 0 ? 'text-status-bad' : 'text-status-good'}`}>
            Balance: {(balance ?? 0).toLocaleString()}
          </p>
        )}
        {error && <p className="text-xs text-status-bad">{error}</p>}
        <div className="flex gap-2">
          <button
            disabled={isPending || (balance ?? 0) > 0}
            onClick={handleCheckOut}
            className="text-xs font-medium text-ink-soft hover:text-ink disabled:opacity-50"
          >
            {isPending ? 'Checking out...' : 'Confirm check-out'}
          </button>
          <button
            onClick={() => setMode('closed')}
            className="text-xs font-medium text-ink-soft hover:text-indigo-700"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  if (status === 'confirmed') {
    return (
      <button
        onClick={openCheckIn}
        className="text-xs font-medium text-status-good hover:opacity-90"
      >
        Check in
      </button>
    )
  }

  if (status === 'checked_in') {
    return (
      <button
        onClick={openCheckOut}
        className="text-xs font-medium text-ink-soft hover:text-ink"
      >
        Check out
      </button>
    )
  }

  return null
}