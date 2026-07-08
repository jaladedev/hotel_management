'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaff } from '@/lib/get-current-staff'

// ---------- Menu ----------

export async function createMenuCategory(formData: FormData) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin') return { error: 'Only admins can manage the menu.' }

  const supabase = await createClient()
  const { error } = await supabase.from('menu_categories').insert({
    name: String(formData.get('name')),
    sort_order: Number(formData.get('sort_order') || 0),
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/fnb/menu')
  return { success: true }
}

export async function createMenuItem(formData: FormData) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin') return { error: 'Only admins can manage the menu.' }

  const supabase = await createClient()
  const { error } = await supabase.from('menu_items').insert({
    category_id: String(formData.get('category_id')),
    name: String(formData.get('name')),
    description: String(formData.get('description') || '') || null,
    price: Number(formData.get('price')),
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/fnb/menu')
  return { success: true }
}

export async function toggleMenuItemAvailable(id: string, isAvailable: boolean) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin') return { error: 'Only admins can manage the menu.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('menu_items')
    .update({ is_available: isAvailable })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/fnb/menu')
  return { success: true }
}

// ---------- Tables ----------

export async function createTable(formData: FormData) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin' && staff.role !== 'front_desk') {
    return { error: 'You do not have permission to manage tables.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('restaurant_tables').insert({
    table_number: String(formData.get('table_number')),
    seats: Number(formData.get('seats') || 2),
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/fnb/tables')
  return { success: true }
}

export async function updateTableStatus(id: string, status: string) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin' && staff.role !== 'front_desk') {
    return { error: 'You do not have permission to manage tables.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('restaurant_tables')
    .update({ status: status as never })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/fnb/tables')
  return { success: true }
}

// ---------- Orders ----------

export async function createOrder(input: {
  orderType: 'dine_in' | 'room_service'
  tableId?: string
  reservationId?: string
  walkinGuestName?: string
}) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin' && staff.role !== 'front_desk') {
    return { error: 'You do not have permission to create orders.' }
  }

  if (!input.reservationId && !input.walkinGuestName) {
    return { error: 'Link a room reservation or enter a walk-in guest name.' }
  }

  const supabase = await createClient()

  const { data: order, error } = await supabase
    .from('fnb_orders')
    .insert({
      order_type: input.orderType,
      table_id: input.tableId || null,
      reservation_id: input.reservationId || null,
      walkin_guest_name: input.reservationId ? null : input.walkinGuestName,
      created_by: staff.id,
    })
    .select('id')
    .single()

  if (error || !order) return { error: error?.message || 'Could not create order.' }

  if (input.tableId) {
    await supabase.from('restaurant_tables').update({ status: 'occupied' }).eq('id', input.tableId)
  }

  revalidatePath('/dashboard/fnb/orders')
  return { success: true, orderId: order.id }
}

export async function addOrderItem(orderId: string, formData: FormData) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin' && staff.role !== 'front_desk') {
    return { error: 'You do not have permission to modify orders.' }
  }

  const supabase = await createClient()

  const menuItemId = String(formData.get('menu_item_id'))
  const quantity = Number(formData.get('quantity') || 1)

  const { data: menuItem } = await supabase
    .from('menu_items')
    .select('name, price')
    .eq('id', menuItemId)
    .single()

  if (!menuItem) return { error: 'Menu item not found.' }

  const { error } = await supabase.from('fnb_order_items').insert({
    order_id: orderId,
    menu_item_id: menuItemId,
    item_name: menuItem.name,
    unit_price: menuItem.price,
    quantity,
    notes: String(formData.get('notes') || '') || null,
  })

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/fnb/orders/${orderId}`)
  return { success: true }
}

export async function closeOrder(orderId: string, formData: FormData) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin' && staff.role !== 'front_desk') {
    return { error: 'You do not have permission to close orders.' }
  }

  const supabase = await createClient()

  const { data: order } = await supabase
    .from('fnb_orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (!order || order.status === 'closed') return { error: 'Order already closed or not found.' }

  const { data: totalRow } = await supabase
    .from('fnb_order_totals')
    .select('total')
    .eq('order_id', orderId)
    .maybeSingle()

  const total = totalRow?.total ?? 0

  if (order.reservation_id) {
    // Guest is staying at the hotel — post as a folio incidental charge.
    const { data: folio } = await supabase
      .from('folios')
      .select('id')
      .eq('reservation_id', order.reservation_id)
      .single()

    if (folio) {
      await supabase.from('folio_line_items').insert({
        folio_id: folio.id,
        type: 'incidental',
        description: `Restaurant order (${order.order_type === 'room_service' ? 'room service' : 'dine-in'})`,
        amount: total,
        created_by: staff.id,
      })
    }
  } else {
    // Walk-in — standalone payment, not tied to any folio.
    const method = String(formData.get('paid_method') || 'cash')
    await supabase
      .from('fnb_orders')
      .update({ paid_amount: total, paid_method: method as never })
      .eq('id', orderId)
  }

  await supabase
    .from('fnb_orders')
    .update({ status: 'closed', closed_at: new Date().toISOString() })
    .eq('id', orderId)

  if (order.table_id) {
    await supabase.from('restaurant_tables').update({ status: 'cleaning' }).eq('id', order.table_id)
  }

  revalidatePath('/dashboard/fnb/orders')
  revalidatePath(`/dashboard/fnb/orders/${orderId}`)
  return { success: true }
}