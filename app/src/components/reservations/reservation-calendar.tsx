import type { Tables } from '@/lib/database.types'

type RoomWithType = Tables<'rooms'> & { room_types: { name: string } | null }
type ReservationForCalendar = {
  id: string
  room_id: string | null
  check_in: string
  check_out: string
  status: string
  guests: { first_name: string; last_name: string } | null
}

function formatDateKey(d: Date) {
  return d.toISOString().slice(0, 10)
}

function isDateOccupied(dateKey: string, checkIn: string, checkOut: string) {
  // Half-open interval: check-out day itself is not occupied (same-day turnover)
  return dateKey >= checkIn && dateKey < checkOut
}

export function ReservationCalendar({
  rooms,
  reservations,
  dates,
}: {
  rooms: RoomWithType[]
  reservations: ReservationForCalendar[]
  dates: Date[]
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-rule bg-white">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 border-b border-r border-rule bg-paper-dim px-3 py-2 text-left font-medium text-ink-soft">
              Room
            </th>
            {dates.map((d) => (
              <th
                key={d.toISOString()}
                className="min-w-[70px] border-b border-rule bg-paper-dim px-2 py-2 text-center font-medium text-ink-soft"
              >
                {d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rooms.map((room) => (
            <tr key={room.id} className="border-b border-rule">
              <td className="sticky left-0 z-10 border-r border-rule bg-white px-3 py-2 font-medium text-ink">
                {room.room_number}
                <span className="ml-1 font-normal text-ink-soft/60">
                  {room.room_types?.name}
                </span>
              </td>
              {dates.map((d) => {
                const dateKey = formatDateKey(d)
                const reservation = reservations.find(
                  (r) =>
                    r.room_id === room.id && isDateOccupied(dateKey, r.check_in, r.check_out)
                )
                return (
                  <td
                    key={dateKey}
                    className={`px-2 py-2 text-center ${
                      reservation ? 'bg-status-info-bg text-indigo-800' : 'bg-white text-ink-soft/40'
                    }`}
                    title={
                      reservation?.guests
                        ? `${reservation.guests.first_name} ${reservation.guests.last_name}`
                        : undefined
                    }
                  >
                    {reservation?.guests
                      ? `${reservation.guests.first_name.slice(0, 1)}${reservation.guests.last_name.slice(0, 1)}`
                      : '·'}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}