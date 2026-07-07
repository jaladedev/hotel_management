import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EventBookingActions } from '@/components/events/event-booking-actions'

export default async function EventBookingDetailPage({
  params,
}: {
  params: Promise<{ bookingId: string }>
}) {
  const { bookingId } = await params
  const supabase = await createClient()

  const { data: booking } = await supabase
    .from('event_bookings')
    .select('*, event_spaces(name), guests(first_name, last_name, email, phone)')
    .eq('id', bookingId)
    .single()

  if (!booking) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-medium text-ink">{booking.event_name}</h1>
        <p className="text-sm text-ink-soft">{booking.event_spaces?.name}</p>
      </div>

      <div className="rounded-lg border border-rule bg-white p-5 text-sm">
        <table className="w-full">
          <tbody>
            <tr>
              <td className="w-32 py-1 font-medium text-ink-soft">Contact</td>
              <td className="py-1 text-ink">
                {booking.guests?.first_name} {booking.guests?.last_name} — {booking.guests?.email}
              </td>
            </tr>
            <tr>
              <td className="py-1 font-medium text-ink-soft">Date</td>
              <td className="py-1 font-mono text-ink">{booking.event_date}</td>
            </tr>
            <tr>
              <td className="py-1 font-medium text-ink-soft">Time</td>
              <td className="py-1 font-mono text-ink">
                {booking.start_time}–{booking.end_time}
              </td>
            </tr>
            {booking.headcount && (
              <tr>
                <td className="py-1 font-medium text-ink-soft">Headcount</td>
                <td className="py-1 text-ink">{booking.headcount}</td>
              </tr>
            )}
            {booking.setup_type && (
              <tr>
                <td className="py-1 font-medium text-ink-soft">Setup</td>
                <td className="py-1 text-ink">{booking.setup_type}</td>
              </tr>
            )}
            {booking.catering_notes && (
              <tr>
                <td className="py-1 align-top font-medium text-ink-soft">Catering</td>
                <td className="py-1 text-ink">{booking.catering_notes}</td>
              </tr>
            )}
            <tr>
              <td className="py-1 font-medium text-ink-soft">Rate quoted</td>
              <td className="py-1 font-mono text-ink">{booking.rate_quoted.toLocaleString()}</td>
            </tr>
            <tr>
              <td className="py-1 font-medium text-ink-soft">Status</td>
              <td className="py-1 capitalize text-ink">{booking.status}</td>
            </tr>
            {booking.linked_reservation_id && (
              <tr>
                <td className="py-1 font-medium text-ink-soft">Billing</td>
                <td className="py-1 text-ink">Posts to guest&apos;s room folio</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {['pending', 'confirmed'].includes(booking.status) && (
        <EventBookingActions bookingId={booking.id} isWalkIn={!booking.linked_reservation_id} />
      )}
    </div>
  )
}