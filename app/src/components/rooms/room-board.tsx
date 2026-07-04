'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateRoomStatus } from '@/app/dashboard/rooms/actions'
import type { Enums, Tables } from '@/lib/database.types'

type RoomWithType = Tables<'rooms'> & { room_types: { name: string } | null }

const STATUS_STYLES: Record<Enums<'room_status'>, string> = {
  vacant: 'bg-green-50 border-green-300 text-green-800',
  occupied: 'bg-red-50 border-red-300 text-red-800',
  dirty: 'bg-amber-50 border-amber-300 text-amber-800',
  clean: 'bg-blue-50 border-blue-300 text-blue-800',
  out_of_order: 'bg-gray-100 border-gray-300 text-gray-600',
}

const STATUS_OPTIONS: Enums<'room_status'>[] = [
  'vacant',
  'occupied',
  'dirty',
  'clean',
  'out_of_order',
]

export function RoomBoard({ initialRooms }: { initialRooms: RoomWithType[] }) {
  const [rooms, setRooms] = useState(initialRooms)
  const [pendingId, setPendingId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // Realtime: any staff member's status change reflects here live,
    // without a page refresh — front desk sees housekeeping's updates instantly.
    const channel = supabase
      .channel('rooms-board')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        (payload) => {
          setRooms((current) => {
            if (payload.eventType === 'UPDATE') {
              return current.map((r) =>
                r.id === payload.new.id ? { ...r, ...(payload.new as Tables<'rooms'>) } : r
              )
            }
            if (payload.eventType === 'INSERT') {
              // New room won't have room_types joined yet — a refresh will pick up
              // the name; for now just skip until next full load.
              return current
            }
            if (payload.eventType === 'DELETE') {
              return current.filter((r) => r.id !== payload.old.id)
            }
            return current
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  function handleStatusChange(roomId: string, status: Enums<'room_status'>) {
    let reason: string | undefined
    if (status === 'out_of_order') {
      reason = window.prompt('Reason for marking out of order:') || undefined
    }
    setPendingId(roomId)
    updateRoomStatus(roomId, status, reason).finally(() => setPendingId(null))
  }

  const roomsByFloor = rooms.reduce<Record<string, RoomWithType[]>>((acc, room) => {
    const floor = room.floor || 'Unassigned'
    acc[floor] = acc[floor] || []
    acc[floor].push(room)
    return acc
  }, {})

  const floors = Object.keys(roomsByFloor).sort()

  return (
    <div className="space-y-6">
      <div className="flex gap-4 text-xs text-gray-600">
        {STATUS_OPTIONS.map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded-full border ${STATUS_STYLES[s]}`} />
            {s.replace(/_/g, ' ')}
          </div>
        ))}
      </div>

      {floors.map((floor) => (
        <div key={floor}>
          <h2 className="mb-2 text-xs font-semibold uppercase text-gray-500">Floor {floor}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {roomsByFloor[floor]
              .sort((a, b) => a.room_number.localeCompare(b.room_number))
              .map((room) => (
                <div
                  key={room.id}
                  className={`rounded-lg border-2 p-3 transition-opacity ${STATUS_STYLES[room.status]} ${
                    pendingId === room.id ? 'opacity-50' : ''
                  }`}
                >
                  <p className="text-sm font-semibold">{room.room_number}</p>
                  <p className="truncate text-xs opacity-80">{room.room_types?.name}</p>
                  <p className="mt-1 text-xs font-medium capitalize">
                    {room.status.replace(/_/g, ' ')}
                  </p>
                  {room.status === 'out_of_order' && room.out_of_order_reason && (
                    <p className="mt-0.5 truncate text-[10px] opacity-70">
                      {room.out_of_order_reason}
                    </p>
                  )}
                  <select
                    defaultValue=""
                    disabled={pendingId === room.id}
                    onChange={(e) => {
                      const value = e.target.value as Enums<'room_status'>
                      if (value) handleStatusChange(room.id, value)
                      e.target.value = ''
                    }}
                    className="mt-2 w-full rounded border border-current/30 bg-white/60 px-1 py-0.5 text-[10px]"
                  >
                    <option value="">Change...</option>
                    {STATUS_OPTIONS.filter((s) => s !== room.status).map((s) => (
                      <option key={s} value={s}>
                        {s.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}