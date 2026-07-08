import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AddOrderItemForm } from '@/components/fnb/add-order-item-form'
import { CloseOrderPanel } from '@/components/fnb/close-order-panel'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('fnb_orders')
    .select('*, restaurant_tables(table_number), reservations(guests(first_name, last_name))')
    .eq('id', orderId)
    .single()

  if (!order) notFound()

  const [{ data: orderItems }, { data: menuItems }, { data: totalRow }] = await Promise.all([
    supabase
      .from('fnb_order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at'),
    supabase.from('menu_items').select('*, menu_categories(name)').eq('is_available', true).order('name'),
    supabase.from('fnb_order_totals').select('total').eq('order_id', orderId).maybeSingle(),
  ])

  const total = totalRow?.total ?? 0
  const guestLabel = order.reservations?.guests
    ? `${order.reservations.guests.first_name} ${order.reservations.guests.last_name}`
    : order.walkin_guest_name

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-medium text-ink">{guestLabel}</h1>
        <p className="text-sm text-ink-soft">
          {order.order_type === 'room_service' ? 'Room service' : 'Dine-in'}
          {order.restaurant_tables && ` — Table ${order.restaurant_tables.table_number}`}
          {' · '}
          <span className="capitalize">{order.status}</span>
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-rule bg-white">
        <table className="w-full text-sm">
          <thead className="bg-paper-dim text-left text-xs font-medium uppercase text-ink-soft">
            <tr>
              <th className="px-4 py-2">Item</th>
              <th className="px-4 py-2">Qty</th>
              <th className="px-4 py-2 text-right">Unit</th>
              <th className="px-4 py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule/60">
            {(orderItems || []).map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2 text-ink">
                  {item.item_name}
                  {item.notes && <p className="text-xs text-ink-soft">{item.notes}</p>}
                </td>
                <td className="px-4 py-2 text-ink-soft">{item.quantity}</td>
                <td className="px-4 py-2 text-right font-mono text-ink-soft">
                  {item.unit_price.toLocaleString()}
                </td>
                <td className="px-4 py-2 text-right font-mono text-ink">
                  {(item.unit_price * item.quantity).toLocaleString()}
                </td>
              </tr>
            ))}
            {(orderItems || []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center text-ink-soft/60">
                  No items added yet.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="border-t-2 border-brass-500 bg-paper-dim">
            <tr>
              <td colSpan={3} className="px-4 py-3 text-right font-medium text-ink">
                Total
              </td>
              <td className="px-4 py-3 text-right font-mono text-base font-semibold text-ink">
                {total.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {order.status !== 'closed' && (
        <>
          <AddOrderItemForm orderId={orderId} menuItems={menuItems || []} />
          <CloseOrderPanel orderId={orderId} isWalkIn={!order.reservation_id} />
        </>
      )}
    </div>
  )
}