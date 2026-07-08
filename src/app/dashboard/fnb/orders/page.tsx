import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NewOrderForm } from '@/components/fnb/new-order-form'

export default async function OrdersPage() {
  const supabase = await createClient()

  const [{ data: orders }, { data: tables }, { data: checkedInReservations }] = await Promise.all([
    supabase
      .from('fnb_orders')
      .select('*, restaurant_tables(table_number), reservations(guests(first_name, last_name))')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('restaurant_tables').select('*').order('table_number'),
    supabase
      .from('reservations')
      .select('id, guests(first_name, last_name), rooms(room_number)')
      .eq('status', 'checked_in'),
  ])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-xl font-medium text-ink">Orders</h1>
        <NewOrderForm tables={tables || []} reservations={checkedInReservations || []} />
      </div>

      <table className="w-full overflow-hidden rounded-lg border border-rule bg-white text-sm">
        <thead className="bg-paper-dim text-left text-xs font-medium uppercase text-ink-soft">
          <tr>
            <th className="px-4 py-2">Guest / Table</th>
            <th className="px-4 py-2">Type</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Created</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule/60">
          {(orders || []).map((o) => (
            <tr key={o.id}>
              <td className="px-4 py-2 text-ink">
                {o.reservations?.guests
                  ? `${o.reservations.guests.first_name} ${o.reservations.guests.last_name}`
                  : o.walkin_guest_name}
                {o.restaurant_tables && (
                  <span className="ml-2 text-xs text-ink-soft">Table {o.restaurant_tables.table_number}</span>
                )}
              </td>
              <td className="px-4 py-2 capitalize text-ink-soft">{o.order_type.replace('_', ' ')}</td>
              <td className="px-4 py-2 capitalize text-ink-soft">{o.status}</td>
              <td className="px-4 py-2 text-ink-soft">
                {new Date(o.created_at).toLocaleString()}
              </td>
              <td className="px-4 py-2">
                <Link
                  href={`/dashboard/fnb/orders/${o.id}`}
                  className="text-xs font-medium text-indigo-700 hover:text-indigo-800"
                >
                  View order
                </Link>
              </td>
            </tr>
          ))}
          {(orders || []).length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-ink-soft/60">
                No orders yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}