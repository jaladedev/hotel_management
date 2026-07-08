import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaff } from '@/lib/get-current-staff'
import { CashReconciliationForm } from '@/components/reports/cash-reconciliation-form'
import { RunNoShowCheckButton } from '@/components/reservations/run-no-show-check-button'

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>
}) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()
  const params = await searchParams

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayKey = formatDate(today)

  const defaultStart = new Date(today)
  defaultStart.setDate(defaultStart.getDate() - 6)

  const startDate = params.start || formatDate(defaultStart)
  const endDate = params.end || todayKey
  const daysInRange =
    Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1

  // ---------- Today's arrivals / departures ----------
  const [{ data: arrivals }, { data: departures }] = await Promise.all([
    supabase
      .from('reservations')
      .select('id, check_in, guests(first_name, last_name), room_types(name), status')
      .eq('check_in', todayKey)
      .neq('status', 'cancelled'),
    supabase
      .from('reservations')
      .select('id, check_out, guests(first_name, last_name), room_types(name), status')
      .eq('check_out', todayKey)
      .in('status', ['checked_in', 'checked_out']),
  ])

  // ---------- Occupancy snapshot (right now) ----------
  const { data: rooms } = await supabase.from('rooms').select('status')
  const activeRooms = (rooms || []).filter((r) => r.status !== 'out_of_order')
  const occupiedRooms = activeRooms.filter((r) => r.status === 'occupied')
  const occupancyRate =
    activeRooms.length > 0 ? (occupiedRooms.length / activeRooms.length) * 100 : 0

  // ---------- ADR / RevPAR for the selected range ----------
  const { data: staysInRange } = await supabase
    .from('reservations')
    .select('check_in, check_out')
    .not('room_id', 'is', null)
    .in('status', ['checked_in', 'checked_out'])
    .lt('check_in', endDate)
    .gt('check_out', startDate)

  const rangeStartMs = new Date(startDate).getTime()
  const rangeEndMs = new Date(endDate).getTime() + 86400000 // inclusive of end date

  const roomNightsSold = (staysInRange || []).reduce((sum, r) => {
    const stayStart = Math.max(new Date(r.check_in).getTime(), rangeStartMs)
    const stayEnd = Math.min(new Date(r.check_out).getTime(), rangeEndMs)
    const nights = Math.max(0, Math.round((stayEnd - stayStart) / 86400000))
    return sum + nights
  }, 0)

  const { data: roomChargeItems } = await supabase
    .from('folio_line_items')
    .select('amount, folios(reservations(check_in))')
    .eq('type', 'room_charge')

  const roomRevenue = (roomChargeItems || [])
    .filter((item) => {
      const checkIn = (item as unknown as { folios: { reservations: { check_in: string } | null } | null })
        .folios?.reservations?.check_in
      return checkIn && checkIn >= startDate && checkIn <= endDate
    })
    .reduce((sum, item) => sum + item.amount, 0)

  const adr = roomNightsSold > 0 ? roomRevenue / roomNightsSold : 0
  const revPAR = activeRooms.length > 0 ? roomRevenue / (activeRooms.length * daysInRange) : 0

  // ---------- Revenue by payment method ----------
  // Three sources feed this: guest folio payments (cash/Paystack, tied to a
  // stay), walk-in F&B orders (no folio — settled directly on the order),
  // and walk-in event bookings (no folio — settled directly on the booking).
  // Folio payments are dated by created_at (when paid); walk-in F&B by
  // closed_at (when the sale happened); walk-in events by event_date (the
  // service date), since events don't carry a separate settlement timestamp.
  const [{ data: payments }, { data: walkInOrders }, { data: walkInEvents }] = await Promise.all([
    supabase
      .from('payments')
      .select('method, amount')
      .eq('status', 'success')
      .eq('is_security_deposit', false)
      .gte('created_at', `${startDate}T00:00:00Z`)
      .lte('created_at', `${endDate}T23:59:59Z`),
    supabase
      .from('fnb_orders')
      .select('paid_amount, paid_method')
      .eq('status', 'closed')
      .is('reservation_id', null)
      .not('paid_amount', 'is', null)
      .gte('closed_at', `${startDate}T00:00:00Z`)
      .lte('closed_at', `${endDate}T23:59:59Z`),
    supabase
      .from('event_bookings')
      .select('paid_amount, paid_method')
      .eq('status', 'completed')
      .is('linked_reservation_id', null)
      .gt('paid_amount', 0)
      .gte('event_date', startDate)
      .lte('event_date', endDate),
  ])

  const revenueByMethod = (payments || []).reduce<Record<string, number>>((acc, p) => {
    acc[p.method] = (acc[p.method] || 0) + p.amount
    return acc
  }, {})

  for (const order of walkInOrders || []) {
    if (order.paid_method && order.paid_amount) {
      revenueByMethod[order.paid_method] = (revenueByMethod[order.paid_method] || 0) + order.paid_amount
    }
  }
  for (const event of walkInEvents || []) {
    if (event.paid_method && event.paid_amount) {
      revenueByMethod[event.paid_method] = (revenueByMethod[event.paid_method] || 0) + event.paid_amount
    }
  }

  const totalRevenue = Object.values(revenueByMethod).reduce((a, b) => a + b, 0)

  const walkInFnbRevenue = (walkInOrders || []).reduce((sum, o) => sum + (o.paid_amount || 0), 0)
  const walkInEventRevenue = (walkInEvents || []).reduce((sum, e) => sum + (e.paid_amount || 0), 0)
  // Everything else — guest-billed F&B/events, incidentals, taxes, deposits
  // applied, etc. — is commingled in folio payments and isn't cleanly
  // separable by source without tagging line items more specifically.
  const otherRevenue = Math.max(0, totalRevenue - roomRevenue - walkInFnbRevenue - walkInEventRevenue)

  // ---------- Cash reconciliation ----------
  const { data: todaysCashPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('method', 'cash')
    .eq('status', 'success')
    .eq('is_security_deposit', false)
    .gte('created_at', `${todayKey}T00:00:00Z`)
    .lte('created_at', `${todayKey}T23:59:59Z`)

  const expectedCashToday = (todaysCashPayments || []).reduce((sum, p) => sum + p.amount, 0)

  const { data: existingReconciliation } = await supabase
    .from('cash_reconciliations')
    .select('*')
    .eq('reconciliation_date', todayKey)
    .maybeSingle()

  // ---------- Overbooking alerts (today) ----------
  const { data: overbookingAlerts } = await supabase.from('overbooking_alerts').select('*')

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-display font-medium text-ink">Reports & Night Audit</h1>

      {overbookingAlerts && overbookingAlerts.length > 0 && (
        <section className="rounded-lg border-2 border-status-bad/40 bg-status-bad-bg p-4">
          <h2 className="mb-2 text-sm font-semibold text-status-bad">
            Overbooking Alert — Today
          </h2>
          <ul className="space-y-1 text-sm text-status-bad">
            {overbookingAlerts.map((a) => (
              <li key={a.room_type_id}>
                <strong>{a.room_type_name}</strong>: {a.booked_today} booked vs. {a.physical_rooms}{' '}
                physical room(s) — {(a.booked_today ?? 0) - (a.physical_rooms ?? 0)} guest(s) may
                need to be walked to another property.
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* KPI cards */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-rule bg-white p-4">
          <p className="text-xs text-ink-soft">Occupancy (now)</p>
          <p className="mt-1 text-2xl font-display font-medium text-ink">
            {occupancyRate.toFixed(0)}%
          </p>
          <p className="text-xs text-ink-soft/60">
            {occupiedRooms.length} / {activeRooms.length} rooms
          </p>
        </div>
        <div className="rounded-lg border border-rule bg-white p-4">
          <p className="text-xs text-ink-soft">ADR (range)</p>
          <p className="mt-1 text-2xl font-display font-medium text-ink">{adr.toFixed(0)}</p>
          <p className="text-xs text-ink-soft/60">{roomNightsSold} room-nights sold</p>
        </div>
        <div className="rounded-lg border border-rule bg-white p-4">
          <p className="text-xs text-ink-soft">RevPAR (range)</p>
          <p className="mt-1 text-2xl font-display font-medium text-ink">{revPAR.toFixed(0)}</p>
        </div>
        <div className="rounded-lg border border-rule bg-white p-4">
          <p className="text-xs text-ink-soft">Total revenue (range)</p>
          <p className="mt-1 text-2xl font-display font-medium text-ink">
            {totalRevenue.toLocaleString()}
          </p>
        </div>
      </section>

      {/* Date range picker */}
      <form className="flex items-end gap-3" method="get">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">From</label>
          <input
            name="start"
            type="date"
            defaultValue={startDate}
            className="rounded-md border border-rule px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">To</label>
          <input
            name="end"
            type="date"
            defaultValue={endDate}
            className="rounded-md border border-rule px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-paper-dim px-4 py-1.5 text-sm font-medium text-ink-soft hover:bg-rule/50"
        >
          Update range
        </button>
      </form>

      {/* Revenue by method + source */}
      <section className="grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold text-ink">Revenue by Payment Method</h2>
          <table className="w-full overflow-hidden rounded-lg border border-rule bg-white text-sm">
            <tbody className="divide-y divide-rule/60">
              {Object.entries(revenueByMethod).map(([method, amount]) => (
                <tr key={method}>
                  <td className="px-4 py-2 capitalize text-ink-soft">{method}</td>
                  <td className="px-4 py-2 text-right font-mono text-ink">
                    {amount.toLocaleString()}
                  </td>
                </tr>
              ))}
              {Object.keys(revenueByMethod).length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-4 text-center text-ink-soft/60">
                    No payments in this range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-ink">Revenue by Source</h2>
          <table className="w-full overflow-hidden rounded-lg border border-rule bg-white text-sm">
            <tbody className="divide-y divide-rule/60">
              <tr>
                <td className="px-4 py-2 text-ink-soft">Rooms</td>
                <td className="px-4 py-2 text-right font-mono text-ink">
                  {roomRevenue.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-ink-soft">Walk-in F&amp;B</td>
                <td className="px-4 py-2 text-right font-mono text-ink">
                  {walkInFnbRevenue.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-ink-soft">Walk-in events</td>
                <td className="px-4 py-2 text-right font-mono text-ink">
                  {walkInEventRevenue.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-ink-soft">
                  Other <span className="text-xs text-ink-soft/60">(guest-billed F&amp;B/events, incidentals, tax)</span>
                </td>
                <td className="px-4 py-2 text-right font-mono text-ink">
                  {otherRevenue.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Arrivals / Departures */}
      <section className="grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold text-ink">Today&apos;s Arrivals</h2>
          <ul className="space-y-1 rounded-lg border border-rule bg-white p-3 text-sm">
            {(arrivals || []).map((a) => (
              <li key={a.id} className="flex justify-between">
                <span>
                  {a.guests?.first_name} {a.guests?.last_name}
                </span>
                <span className="text-ink-soft">{a.room_types?.name}</span>
              </li>
            ))}
            {(arrivals || []).length === 0 && <li className="text-ink-soft/60">None today.</li>}
          </ul>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-semibold text-ink">Today&apos;s Departures</h2>
          <ul className="space-y-1 rounded-lg border border-rule bg-white p-3 text-sm">
            {(departures || []).map((d) => (
              <li key={d.id} className="flex justify-between">
                <span>
                  {d.guests?.first_name} {d.guests?.last_name}
                </span>
                <span className="text-ink-soft">{d.room_types?.name}</span>
              </li>
            ))}
            {(departures || []).length === 0 && <li className="text-ink-soft/60">None today.</li>}
          </ul>
        </div>
      </section>

      {/* Night Audit */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-ink">Night Audit</h2>
        <div className="space-y-4 rounded-lg border border-rule bg-white p-4">
          <div>
            <p className="mb-2 text-xs font-medium text-ink-soft">1. Flag no-shows</p>
            <RunNoShowCheckButton />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-ink-soft">2. Reconcile today&apos;s cash</p>
            <CashReconciliationForm
              date={todayKey}
              expectedCash={expectedCashToday}
              existing={existingReconciliation}
            />
          </div>
        </div>
      </section>
    </div>
  )
}