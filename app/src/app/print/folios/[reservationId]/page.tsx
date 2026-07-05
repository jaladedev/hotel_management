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
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '2rem', color: '#111' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Folio Receipt</h1>
        <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '1.5rem' }}>
          Generated {new Date().toLocaleString()}
        </p>

        <table style={{ width: '100%', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          <tbody>
            <tr>
              <td style={{ fontWeight: 600, paddingRight: '1rem' }}>Guest</td>
              <td>{guestName}</td>
            </tr>
            {reservation.guests?.email && (
              <tr>
                <td style={{ fontWeight: 600 }}>Email</td>
                <td>{reservation.guests.email}</td>
              </tr>
            )}
            {reservation.guests?.phone && (
              <tr>
                <td style={{ fontWeight: 600 }}>Phone</td>
                <td>{reservation.guests.phone}</td>
              </tr>
            )}
            <tr>
              <td style={{ fontWeight: 600 }}>Room</td>
              <td>
                {reservation.room_types?.name}
                {reservation.rooms?.room_number ? ` — Room ${reservation.rooms.room_number}` : ''}
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Stay</td>
              <td>
                {reservation.check_in} to {reservation.check_out}
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Status</td>
              <td style={{ textTransform: 'capitalize' }}>
                {reservation.status.replace(/_/g, ' ')}
              </td>
            </tr>
          </tbody>
        </table>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th style={{ padding: '0.4rem 0' }}>Date</th>
              <th>Description</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {(lineItems || []).map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.4rem 0', color: '#666' }}>
                  {new Date(item.created_at).toLocaleDateString()}
                </td>
                <td>{item.description}</td>
                <td style={{ textAlign: 'right' }}>
                  {item.amount < 0 ? '-' : ''}
                  {Math.abs(item.amount).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid #ddd' }}>
              <td colSpan={2} style={{ padding: '0.5rem 0', fontWeight: 700, textAlign: 'right' }}>
                Balance due
              </td>
              <td style={{ padding: '0.5rem 0', fontWeight: 700, textAlign: 'right' }}>
                {balance.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>

        <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#999' }}>
          Thank you for staying with us.
        </p>
      </div>
    </div>
  )
}