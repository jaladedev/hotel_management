import { RoomRow } from '@/components/rooms/room-row'
import type { Tables } from '@/lib/database.types'

type RoomWithType = Tables<'rooms'> & { room_types: { name: string } | null }

export function RoomsTable({
  rooms,
  roomTypes,
  canManage,
}: {
  rooms: RoomWithType[]
  roomTypes: Tables<'room_types'>[]
  canManage: boolean
}) {
  return (
    <table className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-sm">
      <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
        <tr>
          <th className="px-4 py-2">Room</th>
          <th className="px-4 py-2">Floor</th>
          <th className="px-4 py-2">Type</th>
          <th className="px-4 py-2">Status</th>
          {canManage && <th className="px-4 py-2">Actions</th>}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {rooms.map((room) => (
          <RoomRow key={room.id} room={room} roomTypes={roomTypes} canManage={canManage} />
        ))}
      </tbody>
    </table>
  )
}