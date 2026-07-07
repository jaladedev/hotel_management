import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaff } from '@/lib/get-current-staff'
import { NewEventSpaceForm } from '@/components/events/new-event-space-form'
import { NewEventBookingForm } from '@/components/events/new-event-booking-form'

export default async function EventsPage() {
  const staff = await getCurrentStaff()
  const supabase = await createClient()

  const [{ data: eventSpaces }, { data: bookings }] = await Promise.all([
    supabase.from('event_spaces').select('*').eq('is_active', true).order('name'),
    supabase
      .from('event_bookings')
      .select('*, event_spaces(name), guests(first_name, last_name)')
      .order('event_date', { ascending: false })
      .limit(50),
  ])

  const canManage = staff.role === 'admin' || staff.role === 'front_desk'

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-display text-xl font-medium text-ink">Event Spaces</h1>
          {staff.role === 'admin' && <NewEventSpaceForm />}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {(eventSpaces || []).map((space) => (
            <div key={space.id} className="rounded-lg border border-rule bg-white p-4">
              <p className="font-medium text-ink">{space.name}</p>
              <p className="text-xs text-ink-soft">Capacity: {space.capacity}</p>
              <p className="mt-1 font-mono text-sm text-ink">
                {space.hourly_rate.toLocaleString()}
                <span className="ml-1 font-sans text-xs font-normal text-ink-soft">/ hour</span>
              </p>
            </div>
          ))}
          {(eventSpaces || []).length === 0 && (
            <p className="text-ink-soft">No event spaces set up yet.</p>
          )}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-display text-xl font-medium text-ink">Event Bookings</h1>
          {canManage && <NewEventBookingForm eventSpaces={eventSpaces || []} />}
        </div>
        <table className="w-full overflow-hidden rounded-lg border border-rule bg-white text-sm">
          <thead className="bg-paper-dim text-left text-xs font-medium uppercase text-ink-soft">
            <tr>
              <th className="px-4 py-2">Event</th>
              <th className="px-4 py-2">Space</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Time</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule/60">
            {(bookings || []).map((b) => (
              <tr key={b.id}>
                <td className="px-4 py-2 text-ink">
                  {b.event_name}
                  <p className="text-xs text-ink-soft">
                    {b.guests?.first_name} {b.guests?.last_name}
                  </p>
                </td>
                <td className="px-4 py-2 text-ink-soft">{b.event_spaces?.name}</td>
                <td className="px-4 py-2 font-mono text-ink-soft">{b.event_date}</td>
                <td className="px-4 py-2 font-mono text-ink-soft">
                  {b.start_time}–{b.end_time}
                </td>
                <td className="px-4 py-2 capitalize text-ink-soft">{b.status}</td>
                <td className="px-4 py-2">
                  <Link
                    href={`/dashboard/events/${b.id}`}
                    className="text-xs font-medium text-indigo-700 hover:text-indigo-800"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {(bookings || []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink-soft/60">
                  No event bookings yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  )
}