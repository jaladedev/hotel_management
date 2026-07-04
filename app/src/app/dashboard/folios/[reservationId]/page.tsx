import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaff } from '@/lib/get-current-staff'
import { FolioLedger } from '@/components/folios/folio-ledger'
import { CashPaymentForm } from '@/components/folios/cash-payment-form'
import { IncidentalChargeForm } from '@/components/folios/incidental-charge-form'
import { PaystackPaymentButton } from '@/components/folios/paystack-payment-button'
import { ReservationStatusBadge } from '@/components/reservations/reservation-status-badge'

export default async function FolioDetailPage({
  params,
}: {
  params: Promise<{ reservationId: string }>
}) {
  const staff = await getCurrentStaff()
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
  const canManage = staff.role === 'admin' || staff.role === 'front_desk'
  const guestName = reservation.guests
    ? `${reservation.guests.first_name} ${reservation.guests.last_name}`
    : 'Unknown guest'

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/reservations"
          className="text-xs font-medium text-gray-500 hover:text-gray-700"
        >
          ← Back to reservations
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{guestName}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {reservation.room_types?.name}
            {reservation.rooms?.room_number ? ` — Room ${reservation.rooms.room_number}` : ''}
          </p>
          <p className="text-sm text-gray-600">
            {reservation.check_in} → {reservation.check_out}
          </p>
          {reservation.guests?.email && (
            <p className="text-sm text-gray-500">{reservation.guests.email}</p>
          )}
          {reservation.guests?.phone && (
            <p className="text-sm text-gray-500">{reservation.guests.phone}</p>
          )}
        </div>
        <div className="text-right">
          <ReservationStatusBadge status={reservation.status} />
          <p className="mt-2 text-xs uppercase text-gray-400">
            Folio: {folio.status}
          </p>
        </div>
      </div>

      {canManage && folio.status === 'open' && (
        <div className="flex flex-wrap gap-3">
          <CashPaymentForm folioId={folio.id} />
          {balance > 0 && (
            <PaystackPaymentButton folioId={folio.id} defaultAmount={balance} />
          )}
          <IncidentalChargeForm folioId={folio.id} />
        </div>
      )}

      <FolioLedger lineItems={lineItems || []} balance={balance} />
    </div>
  )
}