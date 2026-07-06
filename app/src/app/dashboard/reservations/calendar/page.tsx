import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ReservationCalendar } from '@/components/reservations/reservation-calendar'

const WINDOW_DAYS = 14

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default async function ReservationCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const startDate = params.start ? new Date(params.start) : new Date()
  startDate.setHours(0, 0, 0, 0)

  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + WINDOW_DAYS)

  const prevStart = new Date(startDate)
  prevStart.setDate(prevStart.getDate() - WINDOW_DAYS)
  const nextStart = new Date(startDate)
  nextStart.setDate(nextStart.getDate() + WINDOW_DAYS)

  const dates: Date[] = []
  for (let i = 0; i < WINDOW_DAYS; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    dates.push(d)
  }

  const [{ data: rooms }, { data: reservations }] = await Promise.all([
    supabase.from('rooms').select('*, room_types(name)').order('room_number'),
    supabase
      .from('reservations')
      .select('id, room_id, check_in, check_out, status, guests(first_name, last_name)')
      .not('room_id', 'is', null)
      .in('status', ['checked_in', 'checked_out'])
      .lt('check_in', formatDate(endDate))
      .gt('check_out', formatDate(startDate)),
  ])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-display font-medium text-ink">Reservation Calendar</h1>
        <div className="flex gap-2 text-sm">
          <Link
            href={`/dashboard/reservations/calendar?start=${formatDate(prevStart)}`}
            className="rounded-md bg-paper-dim px-3 py-1.5 font-medium text-ink-soft hover:bg-rule/50"
          >
            ← Previous
          </Link>
          <Link
            href={`/dashboard/reservations/calendar?start=${formatDate(new Date())}`}
            className="rounded-md bg-paper-dim px-3 py-1.5 font-medium text-ink-soft hover:bg-rule/50"
          >
            Today
          </Link>
          <Link
            href={`/dashboard/reservations/calendar?start=${formatDate(nextStart)}`}
            className="rounded-md bg-paper-dim px-3 py-1.5 font-medium text-ink-soft hover:bg-rule/50"
          >
            Next →
          </Link>
        </div>
      </div>

      <p className="mb-4 text-xs text-ink-soft">
        Only shows rooms with a guest currently or previously checked in for this window.
        Confirmed reservations without an assigned room (not yet checked in) won&apos;t
        appear here — check the reservations list for those.
      </p>

      <ReservationCalendar rooms={rooms || []} reservations={reservations || []} dates={dates} />
    </div>
  )
}