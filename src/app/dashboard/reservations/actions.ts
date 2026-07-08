'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaff } from '@/lib/get-current-staff'
import { logAudit } from '@/lib/audit'

export async function getPriceEstimate(roomTypeId: string, checkIn: string, checkOut: string) {
  if (!roomTypeId || !checkIn || !checkOut || checkOut <= checkIn) {
    return { subtotal: 0, tax: 0, total: 0, nights: 0 }
  }

  const supabase = await createClient()

  const { data: subtotal, error: subtotalError } = await supabase.rpc(
    'calculate_stay_subtotal',
    { p_room_type_id: roomTypeId, p_check_in: checkIn, p_check_out: checkOut }
  )
  if (subtotalError) return { error: subtotalError.message, subtotal: 0, tax: 0, total: 0, nights: 0 }

  const { data: tax } = await supabase.rpc('calculate_exclusive_tax', {
    p_subtotal: subtotal ?? 0,
  })

  const nights =
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)

  return {
    subtotal: subtotal ?? 0,
    tax: tax ?? 0,
    total: (subtotal ?? 0) + (tax ?? 0),
    nights,
  }
}

export async function checkAvailability(
  roomTypeId: string,
  checkIn: string,
  checkOut: string
) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('check_availability', {
    p_room_type_id: roomTypeId,
    p_check_in: checkIn,
    p_check_out: checkOut,
  })

  if (error) return { error: error.message, available: 0 }
  return { available: data ?? 0 }
}

async function findOrCreateGuest(formData: FormData) {
  const supabase = await createClient()
  const email = String(formData.get('guest_email') || '').trim() || null

  if (email) {
    const { data: existing } = await supabase
      .from('guests')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existing) return { guestId: existing.id }
  }

  const { data: newGuest, error } = await supabase
    .from('guests')
    .insert({
      first_name: String(formData.get('guest_first_name')),
      last_name: String(formData.get('guest_last_name')),
      email,
      phone: String(formData.get('guest_phone') || '') || null,
      id_type: String(formData.get('guest_id_type') || '') || null,
      id_number: String(formData.get('guest_id_number') || '') || null,
    })
    .select('id')
    .single()

  if (error || !newGuest) return { error: error?.message || 'Could not create guest.' }
  return { guestId: newGuest.id }
}

export async function createReservationAction(formData: FormData) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin' && staff.role !== 'front_desk') {
    return { error: 'You do not have permission to create reservations.' }
  }

  const supabase = await createClient()

  const roomTypeId = String(formData.get('room_type_id'))
  const checkIn = String(formData.get('check_in'))
  const checkOut = String(formData.get('check_out'))

  if (!roomTypeId || !checkIn || !checkOut) {
    return { error: 'Room type and dates are required.' }
  }
  if (checkOut <= checkIn) {
    return { error: 'Check-out must be after check-in.' }
  }

  // Re-verify availability server-side right before booking (UI check can go stale)
  const { available, error: availError } = await checkAvailability(roomTypeId, checkIn, checkOut)
  if (availError) return { error: availError }
  if (available <= 0) return { error: 'No rooms of this type available for the selected dates.' }

  const guestResult = await findOrCreateGuest(formData)
  if (guestResult.error || !guestResult.guestId) {
    return { error: guestResult.error || 'Could not resolve guest.' }
  }

  const { data: subtotal, error: subtotalError } = await supabase.rpc(
    'calculate_stay_subtotal',
    { p_room_type_id: roomTypeId, p_check_in: checkIn, p_check_out: checkOut }
  )
  if (subtotalError) return { error: subtotalError.message }

  const nights =
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
  const averageNightlyRate = (subtotal ?? 0) / nights

  const { data: reservationId, error: rpcError } = await supabase.rpc('create_reservation', {
    p_guest_id: guestResult.guestId,
    p_room_type_id: roomTypeId,
    p_check_in: checkIn,
    p_check_out: checkOut,
    p_rate_applied: averageNightlyRate,
    p_total_amount: subtotal ?? 0,
    p_created_by: staff.id,
  })

  if (rpcError) return { error: rpcError.message }

  // Tax is applied as its own folio line item, on top of the room_charge
  // the RPC just created — this keeps the folio ledger itemized rather
  // than folding tax silently into the room charge.
  const { data: taxAmount } = await supabase.rpc('calculate_exclusive_tax', {
    p_subtotal: subtotal ?? 0,
  })

  if (taxAmount && taxAmount > 0) {
    const { data: folio } = await supabase
      .from('folios')
      .select('id')
      .eq('reservation_id', reservationId)
      .single()

    if (folio) {
      await supabase.from('folio_line_items').insert({
        folio_id: folio.id,
        type: 'tax',
        description: 'Tax',
        amount: taxAmount,
      })
    }
  }

  revalidatePath('/dashboard/reservations')
  return { success: true, reservationId }
}

export async function runNoShowCheck() {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin') {
    return { error: 'Only admins can run the no-show check.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('mark_no_shows')

  if (error) return { error: error.message }

  revalidatePath('/dashboard/reservations')
  return { success: true, count: data ?? 0 }
}

export async function checkAvailabilityForEdit(
  reservationId: string,
  roomTypeId: string,
  checkIn: string,
  checkOut: string
) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('check_availability_excluding_reservation', {
    p_room_type_id: roomTypeId,
    p_check_in: checkIn,
    p_check_out: checkOut,
    p_exclude_reservation_id: reservationId,
  })

  if (error) return { error: error.message, available: 0 }
  return { available: data ?? 0 }
}

export async function updateReservationDetails(reservationId: string, formData: FormData) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin' && staff.role !== 'front_desk') {
    return { error: 'You do not have permission to edit reservations.' }
  }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('reservations')
    .select('status')
    .eq('id', reservationId)
    .single()

  if (!existing) return { error: 'Reservation not found.' }
  if (!['pending', 'confirmed'].includes(existing.status)) {
    return { error: 'Only pending or confirmed reservations can be edited.' }
  }

  const roomTypeId = String(formData.get('room_type_id'))
  const checkIn = String(formData.get('check_in'))
  const checkOut = String(formData.get('check_out'))

  if (!roomTypeId || !checkIn || !checkOut) {
    return { error: 'Room type and dates are required.' }
  }
  if (checkOut <= checkIn) {
    return { error: 'Check-out must be after check-in.' }
  }

  const { available, error: availError } = await checkAvailabilityForEdit(
    reservationId,
    roomTypeId,
    checkIn,
    checkOut
  )
  if (availError) return { error: availError }
  if (available <= 0) return { error: 'No rooms of this type available for the selected dates.' }

  const { data: subtotal, error: subtotalError } = await supabase.rpc(
    'calculate_stay_subtotal',
    { p_room_type_id: roomTypeId, p_check_in: checkIn, p_check_out: checkOut }
  )
  if (subtotalError) return { error: subtotalError.message }

  const nights =
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
  const averageNightlyRate = (subtotal ?? 0) / nights

  const { error: updateError } = await supabase
    .from('reservations')
    .update({
      room_type_id: roomTypeId,
      check_in: checkIn,
      check_out: checkOut,
      rate_applied: averageNightlyRate,
      total_amount: subtotal ?? 0,
      room_id: null, // room type may have changed — force re-assignment at check-in
      updated_at: new Date().toISOString(),
    })
    .eq('id', reservationId)

  if (updateError) return { error: updateError.message }

  // Reflect the new subtotal on the auto-generated room_charge line item,
  // and recompute tax from scratch (delete + reinsert is simpler and safer
  // than trying to diff old vs new tax rules that may have changed too).
  // Payments already recorded are untouched — only charge-side items update.
  const { data: folio } = await supabase
    .from('folios')
    .select('id')
    .eq('reservation_id', reservationId)
    .single()

  if (folio) {
    await supabase
      .from('folio_line_items')
      .update({
        amount: subtotal ?? 0,
        description: `Room charge: ${nights} nights (updated)`,
      })
      .eq('folio_id', folio.id)
      .eq('type', 'room_charge')

    await supabase
      .from('folio_line_items')
      .delete()
      .eq('folio_id', folio.id)
      .eq('type', 'tax')

    const { data: taxAmount } = await supabase.rpc('calculate_exclusive_tax', {
      p_subtotal: subtotal ?? 0,
    })

    if (taxAmount && taxAmount > 0) {
      await supabase.from('folio_line_items').insert({
        folio_id: folio.id,
        type: 'tax',
        description: 'Tax',
        amount: taxAmount,
      })
    }
  }

  await logAudit(staff.id, 'reservation_edited', 'reservation', reservationId, {
    roomTypeId,
    checkIn,
    checkOut,
  })

  revalidatePath('/dashboard/reservations')
  return { success: true }
}

export async function updateGuestDetails(guestId: string, formData: FormData) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin' && staff.role !== 'front_desk') {
    return { error: 'You do not have permission to edit guest details.' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('guests')
    .update({
      first_name: String(formData.get('guest_first_name')),
      last_name: String(formData.get('guest_last_name')),
      email: String(formData.get('guest_email') || '') || null,
      phone: String(formData.get('guest_phone') || '') || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', guestId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/reservations')
  return { success: true }
}

export async function cancelReservation(id: string) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin' && staff.role !== 'front_desk') {
    return { error: 'You do not have permission to cancel reservations.' }
  }

  const supabase = await createClient()

  const { data: reservation } = await supabase
    .from('reservations')
    .select('check_in, check_out, guests(first_name, email), room_types(name)')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('reservations')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  if (reservation?.guests?.email) {
    const { cancellationEmail, sendEmail } = await import('@/lib/email')
    await sendEmail(
      reservation.guests.email,
      'Your booking has been cancelled',
      cancellationEmail({
        guestName: reservation.guests.first_name,
        roomTypeName: reservation.room_types?.name || 'your room',
        checkIn: reservation.check_in,
        checkOut: reservation.check_out,
      })
    )
  }

  await logAudit(staff.id, 'reservation_cancelled', 'reservation', id, {})

  revalidatePath('/dashboard/reservations')
  return { success: true }
}

// ---------- Check-in / Check-out ----------

export async function getAvailableRoomsForCheckIn(roomTypeId: string) {
  const supabase = await createClient()

  // Rooms of this type that are physically free right now (not mid-clean-cycle
  // for a departing guest, not out of order). Rooms already tied to another
  // checked_in reservation will already show status = 'occupied', so this
  // single status filter is sufficient — no separate reservation lookup needed.
  const { data, error } = await supabase
    .from('rooms')
    .select('id, room_number, status')
    .eq('room_type_id', roomTypeId)
    .in('status', ['vacant', 'clean'])
    .order('room_number')

  if (error) return { error: error.message, rooms: [] }
  return { rooms: data || [] }
}

export async function checkInReservation(reservationId: string, roomId: string) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin' && staff.role !== 'front_desk') {
    return { error: 'You do not have permission to check in guests.' }
  }

  const supabase = await createClient()

  const { data: room } = await supabase
    .from('rooms')
    .select('status')
    .eq('id', roomId)
    .single()

  if (!room || !['vacant', 'clean'].includes(room.status)) {
    return { error: 'Selected room is no longer available. Please pick another.' }
  }

  const { error: resError } = await supabase
    .from('reservations')
    .update({ status: 'checked_in', room_id: roomId, updated_at: new Date().toISOString() })
    .eq('id', reservationId)

  if (resError) return { error: resError.message }

  const { error: roomError } = await supabase
    .from('rooms')
    .update({ status: 'occupied', updated_at: new Date().toISOString() })
    .eq('id', roomId)

  if (roomError) return { error: roomError.message }

  revalidatePath('/dashboard/reservations')
  revalidatePath('/dashboard/rooms')
  return { success: true }
}

export async function getFolioBalance(reservationId: string) {
  const supabase = await createClient()

  const { data: folio } = await supabase
    .from('folios')
    .select('id')
    .eq('reservation_id', reservationId)
    .single()

  if (!folio) return { error: 'Folio not found for this reservation.' }

  const { data: balanceRow } = await supabase
    .from('folio_balances')
    .select('balance')
    .eq('folio_id', folio.id)
    .maybeSingle()

  return { folioId: folio.id, balance: balanceRow?.balance ?? 0 }
}

export async function checkOutReservation(reservationId: string) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin' && staff.role !== 'front_desk') {
    return { error: 'You do not have permission to check out guests.' }
  }

  const supabase = await createClient()

  const balanceResult = await getFolioBalance(reservationId)
  if (balanceResult.error) return { error: balanceResult.error }
  if ((balanceResult.balance ?? 0) > 0) {
    return {
      error: `Outstanding balance of ${balanceResult.balance!.toLocaleString()} must be settled before check-out.`,
    }
  }

  const { data: folioForDeposit } = await supabase
    .from('folios')
    .select('security_deposit_status')
    .eq('id', balanceResult.folioId!)
    .single()

  if (folioForDeposit?.security_deposit_status === 'held') {
    return {
      error: 'A security deposit is still held for this stay. Release or charge it before checking out.',
    }
  }

  const { data: reservation } = await supabase
    .from('reservations')
    .select('room_id')
    .eq('id', reservationId)
    .single()

  const { error: resError } = await supabase
    .from('reservations')
    .update({ status: 'checked_out', updated_at: new Date().toISOString() })
    .eq('id', reservationId)

  if (resError) return { error: resError.message }

  if (reservation?.room_id) {
    const { error: roomError } = await supabase
      .from('rooms')
      .update({ status: 'dirty', updated_at: new Date().toISOString() })
      .eq('id', reservation.room_id)

    if (roomError) return { error: roomError.message }
  }

  const { error: folioError } = await supabase
    .from('folios')
    .update({ status: 'closed', closed_at: new Date().toISOString() })
    .eq('id', balanceResult.folioId!)

  if (folioError) return { error: folioError.message }

  revalidatePath('/dashboard/reservations')
  revalidatePath('/dashboard/rooms')
  return { success: true }
}