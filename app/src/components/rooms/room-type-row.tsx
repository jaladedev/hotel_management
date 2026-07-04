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
        <td colSpan={canManage ? 6 : 5} className="bg-gray-50 px-4 py-3">
          <form action={handleSave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Name</label>
                <input
                  name="name"
                  required
                  defaultValue={roomType.name}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Base Rate
                </label>
                <input
                  name="base_rate"
                  type="number"
                  step="0.01"
                  required
                  defaultValue={roomType.base_rate}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Max Occupancy
                </label>
                <input
                  name="max_occupancy"
                  type="number"
                  required
                  defaultValue={roomType.max_occupancy}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Amenities (comma-separated)
                </label>
                <input
                  name="amenities"
                  defaultValue={(roomType.amenities || []).join(', ')}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                rows={2}
                defaultValue={roomType.description || ''}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
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
      <td className="px-4 py-2 font-medium text-gray-900">{roomType.name}</td>
      <td className="px-4 py-2 text-gray-600">{roomType.base_rate.toLocaleString()}</td>
      <td className="px-4 py-2 text-gray-600">{roomType.max_occupancy}</td>
      <td className="px-4 py-2 text-gray-600">
        {(roomType.amenities || []).join(', ') || '—'}
      </td>
      <td className="px-4 py-2">
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
            roomType.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
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
            className="text-xs font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            Edit
          </button>
          <button
            disabled={isPending}
            onClick={handleToggleActive}
            className="text-xs font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            {roomType.is_active ? 'Deactivate' : 'Activate'}
          </button>
        </td>
      )}
    </tr>
  )
}