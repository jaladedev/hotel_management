import { RoomTypeRow } from '@/components/rooms/room-type-row'
import type { Tables } from '@/lib/database.types'

export function RoomTypesTable({
  roomTypes,
  canManage,
}: {
  roomTypes: Tables<'room_types'>[]
  canManage: boolean
}) {
  return (
    <table className="w-full overflow-hidden rounded-lg border border-rule bg-white text-sm">
      <thead className="bg-paper-dim text-left text-xs font-medium uppercase text-ink-soft">
        <tr>
          <th className="px-4 py-2">Name</th>
          <th className="px-4 py-2">Base Rate</th>
          <th className="px-4 py-2">Max Occ.</th>
          <th className="px-4 py-2">Amenities</th>
          <th className="px-4 py-2">Active</th>
          {canManage && <th className="px-4 py-2"></th>}
        </tr>
      </thead>
      <tbody className="divide-y divide-rule/60">
        {roomTypes.map((rt) => (
          <RoomTypeRow key={rt.id} roomType={rt} canManage={canManage} />
        ))}
      </tbody>
    </table>
  )
}