'use client'

import { useState, useTransition } from 'react'
import { updateRoomStatus } from '@/app/dashboard/rooms/actions'
import { RoomStatusBadge } from '@/components/rooms/room-status-badge'
import type { Enums, Tables } from '@/lib/database.types'

const STATUS_OPTIONS: Enums<'room_status'>[] = [
  'vacant',
  'occupied',
  'dirty',
  'clean',
  'out_of_order',
]

type RoomWithType = Tables<'rooms'> & { room_types: { name: string } | null }

export function RoomsTable({ rooms }: { rooms: RoomWithType[] }) {
  const [isPending, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<string | null>(null)

  function handleStatusChange(roomId: string, status: Enums<'room_status'>) {
    let reason: string | undefined
    if (status === 'out_of_order') {
      reason = window.prompt('Reason for marking out of order:') || undefined
    }
    setPendingId(roomId)
    startTransition(async () => {
      await updateRoomStatus(roomId, status, reason)
      setPendingId(null)
    })
  }

  return (
    <table className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-sm">
      <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
        <tr>
          <th className="px-4 py-2">Room</th>
          <th className="px-4 py-2">Floor</th>
          <th className="px-4 py-2">Type</th>
          <th className="px-4 py-2">Status</th>
          <th className="px-4 py-2">Change status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {rooms.map((room) => (
          <tr key={room.id}>
            <td className="px-4 py-2 font-medium text-gray-900">{room.room_number}</td>
            <td className="px-4 py-2 text-gray-600">{room.floor || '—'}</td>
            <td className="px-4 py-2 text-gray-600">{room.room_types?.name || '—'}</td>
            <td className="px-4 py-2">
              <RoomStatusBadge status={room.status} />
              {room.status === 'out_of_order' && room.out_of_order_reason && (
                <p className="mt-0.5 text-xs text-gray-500">{room.out_of_order_reason}</p>
              )}
            </td>
            <td className="px-4 py-2">
              <select
                defaultValue=""
                disabled={isPending && pendingId === room.id}
                onChange={(e) => {
                  const value = e.target.value as Enums<'room_status'>
                  if (value) handleStatusChange(room.id, value)
                  e.target.value = ''
                }}
                className="rounded-md border border-gray-300 px-2 py-1 text-xs"
              >
                <option value="">Set status...</option>
                {STATUS_OPTIONS.filter((s) => s !== room.status).map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}