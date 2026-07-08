import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaff } from '@/lib/get-current-staff'
import { FolioLedger } from '@/components/folios/folio-ledger'
import { CashPaymentForm } from '@/components/folios/cash-payment-form'
import { IncidentalChargeForm } from '@/components/folios/incidental-charge-form'
import { PaystackPaymentButton } from '@/components/folios/paystack-payment-button'
import { PrintReceiptButton } from '@/components/folios/print-receipt-button'
import { SecurityDepositPanel } from '@/components/folios/security-deposit-panel'
import { RefundsPanel } from '@/components/folios/refunds-panel'
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

  const [{ data: lineItems }, { data: balanceRow }, { data: paystackPayments }, { data: refunds }] =
    await Promise.all([
      supabase
        .from('folio_line_items')
        .select('*')
        .eq('folio_id', folio.id)
        .order('created_at'),
      supabase.from('folio_balances').select('balance').eq('folio_id', folio.id).maybeSingle(),
      supabase
        .from('payments')
        .select('*')
        .eq('folio_id', folio.id)
        .eq('method', 'paystack')
        .eq('status', 'success')
        .eq('is_security_deposit', false),
      supabase
        .from('refunds')
        .select('*')
        .eq('folio_id', folio.id)
        .order('created_at', { ascending: false }),
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
          className="text-xs font-medium text-ink-soft hover:text-indigo-700"
        >
          ← Back to reservations
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-display font-medium text-ink">{guestName}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {reservation.room_types?.name}
            {reservation.rooms?.room_number ? ` — Room ${reservation.rooms.room_number}` : ''}
          </p>
          <p className="text-sm text-ink-soft">
            {reservation.check_in} → {reservation.check_out}
          </p>
          {reservation.guests?.email && (
            <p className="text-sm text-ink-soft">{reservation.guests.email}</p>
          )}
          {reservation.guests?.phone && (
            <p className="text-sm text-ink-soft">{reservation.guests.phone}</p>
          )}
        </div>
        <div className="text-right">
          <ReservationStatusBadge status={reservation.status} />
          {reservation.confirmation_code && (
            <p className="mt-2 ledger-stamp">{reservation.confirmation_code}</p>
          )}
          <p className="mt-2 text-xs uppercase text-ink-soft/60">
            Folio: {folio.status}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {canManage && folio.status === 'open' && (
          <>
            <CashPaymentForm folioId={folio.id} />
            {balance > 0 && (
              <PaystackPaymentButton folioId={folio.id} defaultAmount={balance} />
            )}
            <IncidentalChargeForm folioId={folio.id} />
          </>
        )}
        <PrintReceiptButton reservationId={reservation.id} />
      </div>

      <FolioLedger lineItems={lineItems || []} balance={balance} />

      <div className="grid gap-4 sm:grid-cols-2">
        <SecurityDepositPanel
          folioId={folio.id}
          status={folio.security_deposit_status}
          amount={folio.security_deposit_amount}
        />
        <RefundsPanel
          folioId={folio.id}
          paystackPayments={paystackPayments || []}
          refunds={refunds || []}
        />
      </div>
    </div>
  )
}