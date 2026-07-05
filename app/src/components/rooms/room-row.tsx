'use client'

import { useState, useTransition } from 'react'
import { updateRoom, updateRoomStatus } from '@/app/dashboard/rooms/actions'
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

export function RoomRow({
  room,
  roomTypes,
  canManage,
}: {
  room: RoomWithType
  roomTypes: Tables<'room_types'>[]
  canManage: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleStatusChange(status: Enums<'room_status'>) {
    let reason: string | undefined
    if (status === 'out_of_order') {
      reason = window.prompt('Reason for marking out of order:') || undefined
    }
    startTransition(async () => {
      await updateRoomStatus(room.id, status, reason)
    })
  }

  function handleSave(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await updateRoom(room.id, formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      setEditing(false)
    })
  }

  if (editing) {
    return (
      <tr>
        <td colSpan={5} className="bg-gray-50 px-4 py-3">
          <form action={handleSave} className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Room Number
                </label>
                <input
                  name="room_number"
                  required
                  defaultValue={room.room_number}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Floor</label>
                <input
                  name="floor"
                  defaultValue={room.floor || ''}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Room Type
                </label>
                <select
                  name="room_type_id"
                  required
                  defaultValue={room.room_type_id}
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

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isPending}
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
      <td className="px-4 py-2 font-medium text-gray-900">{room.room_number}</td>
      <td className="px-4 py-2 text-gray-600">{room.floor || '—'}</td>
      <td className="px-4 py-2 text-gray-600">{room.room_types?.name || '—'}</td>
      <td className="px-4 py-2">
        <RoomStatusBadge status={room.status} />
        {room.status === 'out_of_order' && room.out_of_order_reason && (
          <p className="mt-0.5 text-xs text-gray-500">{room.out_of_order_reason}</p>
        )}
      </td>
      {canManage && (
        <td className="px-4 py-2">
          <div className="flex items-center gap-3">
            <select
              defaultValue=""
              disabled={isPending}
              onChange={(e) => {
                const value = e.target.value as Enums<'room_status'>
                if (value) handleStatusChange(value)
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
            <button
              onClick={() => setEditing(true)}
              className="text-xs font-medium text-gray-600 hover:text-gray-900"
            >
              Edit
            </button>
          </div>
        </td>
      )}
    </tr>
  )
}