import { createClient } from '@/lib/supabase/server'
import { getCurrentStaff } from '@/lib/get-current-staff'
import { RoomTypesTable } from '@/components/rooms/room-types-table'
import { RoomsTable } from '@/components/rooms/rooms-table'
import { RoomTypeForm } from '@/components/rooms/room-type-form'
import { RoomForm } from '@/components/rooms/room-form'

export default async function RoomsPage() {
  const staff = await getCurrentStaff()
  const supabase = await createClient()

  const [{ data: roomTypes }, { data: rooms }] = await Promise.all([
    supabase.from('room_types').select('*').order('base_rate'),
    supabase
      .from('rooms')
      .select('*, room_types(name)')
      .order('room_number'),
  ])

  const canManageRoomTypes = staff.role === 'admin'
  const canManageRooms = staff.role === 'admin' || staff.role === 'front_desk'

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-display font-medium text-ink">Room Types</h1>
          {canManageRoomTypes && <RoomTypeForm />}
        </div>
        <RoomTypesTable roomTypes={roomTypes || []} canManage={canManageRoomTypes} />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-display font-medium text-ink">Rooms</h1>
          {canManageRooms && <RoomForm roomTypes={roomTypes || []} />}
        </div>
        <RoomsTable rooms={rooms || []} roomTypes={roomTypes || []} canManage={canManageRooms} />
      </section>
    </div>
  )
}