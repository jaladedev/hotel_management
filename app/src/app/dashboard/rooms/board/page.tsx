import { createClient } from '@/lib/supabase/server'
import { RoomBoard } from '@/components/rooms/room-board'

export default async function RoomBoardPage() {
  const supabase = await createClient()

  const { data: rooms } = await supabase
    .from('rooms')
    .select('*, room_types(name)')
    .order('room_number')

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Room Board</h1>
      <RoomBoard initialRooms={rooms || []} />
    </div>
  )
}