'use client'

import { useState, useTransition } from 'react'
import { updateRoomType, toggleRoomTypeActive } from '@/app/dashboard/rooms/actions'
import type { Tables } from '@/lib/database.types'

export function RoomTypeRow({
  roomType,
  canManage,
}: {
  roomType: Tables<'room_types'>
  canManage: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleToggleActive() {
    startTransition(async () => {
      await toggleRoomTypeActive(roomType.id, !roomType.is_active)
    })
  }

  function handleSave(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await updateRoomType(roomType.id, formData)
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
        <td colSpan={canManage ? 6 : 5} className="bg-paper-dim px-4 py-3">
          <form action={handleSave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">Name</label>
                <input
                  name="name"
                  required
                  defaultValue={roomType.name}
                  className="w-full rounded-md border border-rule px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Base Rate
                </label>
                <input
                  name="base_rate"
                  type="number"
                  step="0.01"
                  required
                  defaultValue={roomType.base_rate}
                  className="w-full rounded-md border border-rule px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Max Occupancy
                </label>
                <input
                  name="max_occupancy"
                  type="number"
                  required
                  defaultValue={roomType.max_occupancy}
                  className="w-full rounded-md border border-rule px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Amenities (comma-separated)
                </label>
                <input
                  name="amenities"
                  defaultValue={(roomType.amenities || []).join(', ')}
                  className="w-full rounded-md border border-rule px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Overbooking Tolerance
                </label>
                <input
                  name="overbooking_tolerance"
                  type="number"
                  min={0}
                  defaultValue={roomType.overbooking_tolerance}
                  className="w-full rounded-md border border-rule px-3 py-1.5 text-sm"
                />
                <p className="mt-0.5 text-[10px] text-ink-soft/70">
                  Extra bookings allowed beyond physical room count (0 = no overbooking)
                </p>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">
                Description
              </label>
              <textarea
                name="description"
                rows={2}
                defaultValue={roomType.description || ''}
                className="w-full rounded-md border border-rule px-3 py-1.5 text-sm"
              />
            </div>

            {error && <p className="text-sm text-status-bad">{error}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-md bg-indigo-700 px-4 py-1.5 text-sm font-medium text-paper hover:bg-indigo-800 disabled:opacity-50"
              >
                {isPending ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-md px-4 py-1.5 text-sm font-medium text-ink-soft hover:bg-paper-dim"
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
      <td className="px-4 py-2 font-medium text-ink">{roomType.name}</td>
      <td className="px-4 py-2 text-ink-soft">{roomType.base_rate.toLocaleString()}</td>
      <td className="px-4 py-2 text-ink-soft">{roomType.max_occupancy}</td>
      <td className="px-4 py-2 text-ink-soft">
        {(roomType.amenities || []).join(', ') || '—'}
        {roomType.overbooking_tolerance > 0 && (
          <span className="ml-2 inline-block rounded-full bg-brass-100 px-2 py-0.5 text-[10px] font-medium text-brass-700">
            +{roomType.overbooking_tolerance} overbook
          </span>
        )}
      </td>
      <td className="px-4 py-2">
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
            roomType.is_active ? 'bg-status-good-bg text-status-good' : 'bg-status-neutral-bg text-ink-soft'
          }`}
        >
          {roomType.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      {canManage && (
        <td className="space-x-3 px-4 py-2">
          <button
            disabled={isPending}
            onClick={() => setEditing(true)}
            className="text-xs font-medium text-ink-soft hover:text-ink disabled:opacity-50"
          >
            Edit
          </button>
          <button
            disabled={isPending}
            onClick={handleToggleActive}
            className="text-xs font-medium text-ink-soft hover:text-ink disabled:opacity-50"
          >
            {roomType.is_active ? 'Deactivate' : 'Activate'}
          </button>
        </td>
      )}
    </tr>
  )
}