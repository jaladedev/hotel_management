import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaff } from '@/lib/get-current-staff'

export default async function FolioPrintPage({
  params,
}: {
  params: Promise<{ reservationId: string }>
}) {
  // Not inside /dashboard, so middleware doesn't gate this route automatically —
  // enforce the same staff-only access explicitly here.
  await getCurrentStaff()

  const supabase = await createClient()
  const { reservationId } = await params

  const { data: reservation } = await supabase
    .from('reservations')
    .select('*, guests(first_name, last_name, email, phone), room_types(name), rooms(room_number)')
    .eq('id', reservationId)
    .single()

  if (!reservation) notFound()

  const { data: folio } = await supabase
    .from('folios')
    .select('*')
    .eq('reservation_id', reservationId)
    .single()

  if (!folio) notFound()

  const [{ data: lineItems }, { data: balanceRow }] = await Promise.all([
    supabase
      .from('folio_line_items')
      .select('*')
      .eq('folio_id', folio.id)
      .order('created_at'),
    supabase.from('folio_balances').select('balance').eq('folio_id', folio.id).maybeSingle(),
  ])

  const balance = balanceRow?.balance ?? 0
  const guestName = reservation.guests
    ? `${reservation.guests.first_name} ${reservation.guests.last_name}`
    : 'Unknown guest'

  return (
    <div className="min-h-screen bg-paper px-8 py-10 text-ink print:bg-white print:py-0">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-start justify-between border-b-2 border-brass-500 pb-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brass-600">
              Guest Folio
            </p>
            <h1 className="font-display text-2xl font-medium text-ink">Receipt</h1>
          </div>
          <p className="pt-1 text-right font-mono text-xs text-ink-soft">
            {new Date().toLocaleString()}
          </p>
        </div>

        <table className="mb-6 w-full text-sm">
          <tbody>
            <tr>
              <td className="w-32 py-0.5 font-medium text-ink-soft">Guest</td>
              <td className="py-0.5 text-ink">{guestName}</td>
            </tr>
            {reservation.guests?.email && (
              <tr>
                <td className="py-0.5 font-medium text-ink-soft">Email</td>
                <td className="py-0.5 text-ink">{reservation.guests.email}</td>
              </tr>
            )}
            {reservation.guests?.phone && (
              <tr>
                <td className="py-0.5 font-medium text-ink-soft">Phone</td>
                <td className="py-0.5 text-ink">{reservation.guests.phone}</td>
              </tr>
            )}
            <tr>
              <td className="py-0.5 font-medium text-ink-soft">Room</td>
              <td className="py-0.5 text-ink">
                {reservation.room_types?.name}
                {reservation.rooms?.room_number ? ` — Room ${reservation.rooms.room_number}` : ''}
              </td>
            </tr>
            <tr>
              <td className="py-0.5 font-medium text-ink-soft">Stay</td>
              <td className="py-0.5 font-mono text-ink">
                {reservation.check_in} to {reservation.check_out}
              </td>
            </tr>
            <tr>
              <td className="py-0.5 font-medium text-ink-soft">Status</td>
              <td className="py-0.5 capitalize text-ink">
                {reservation.status.replace(/_/g, ' ')}
              </td>
            </tr>
            <tr>
              <td className="py-0.5 align-top font-medium text-ink-soft">Reference</td>
              <td className="py-0.5">
                <span className="ledger-stamp">{reservation.confirmation_code || reservation.id}</span>
              </td>
            </tr>
          </tbody>
        </table>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-rule text-left">
              <th className="py-1.5 font-medium text-ink-soft">Date</th>
              <th className="py-1.5 font-medium text-ink-soft">Description</th>
              <th className="py-1.5 text-right font-medium text-ink-soft">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(lineItems || []).map((item) => (
              <tr key={item.id} className="border-b border-rule">
                <td className="py-1.5 font-mono text-xs text-ink-soft">
                  {new Date(item.created_at).toLocaleDateString()}
                </td>
                <td className="py-1.5 text-ink">{item.description}</td>
                <td className="py-1.5 text-right font-mono text-ink">
                  {item.amount < 0 ? '-' : ''}
                  {Math.abs(item.amount).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-brass-500">
              <td colSpan={2} className="py-2 text-right font-medium text-ink">
                Balance due
              </td>
              <td className="py-2 text-right font-mono text-base font-semibold text-ink">
                {balance.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>

        <p className="mt-8 text-center text-xs text-ink-soft">Thank you for staying with us.</p>
      </div>
    </div>
  )
}