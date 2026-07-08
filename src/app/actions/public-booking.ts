'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail, bookingConfirmationEmail, cancellationEmail } from '@/lib/email'

export async function getActiveRoomTypes() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('room_types')
    .select('*')
    .eq('is_active', true)
    .order('base_rate')

  if (error) {
    // This surfaces in the terminal running `npm run dev`, not the browser —
    // if rooms aren't showing on the public site, check here first. Most
    // likely cause: SUPABASE_SERVICE_ROLE_KEY missing/wrong in .env.local.
    console.error('getActiveRoomTypes failed:', error.message)
  }

  return data || []
}

export async function publicCheckAvailability(
  roomTypeId: string,
  checkIn: string,
  checkOut: string
) {
  if (!roomTypeId || !checkIn || !checkOut || checkOut <= checkIn) {
    return { available: 0 }
  }
  const supabase = createServiceClient()
  const { data, error } = await supabase.rpc('check_availability', {
    p_room_type_id: roomTypeId,
    p_check_in: checkIn,
    p_check_out: checkOut,
  })
  if (error) return { error: error.message, available: 0 }
  return { available: data ?? 0 }
}

export async function publicGetPriceEstimate(
  roomTypeId: string,
  checkIn: string,
  checkOut: string
) {
  if (!roomTypeId || !checkIn || !checkOut || checkOut <= checkIn) {
    return { subtotal: 0, tax: 0, total: 0, nights: 0 }
  }
  const supabase = createServiceClient()

  const { data: subtotal, error: subtotalError } = await supabase.rpc(
    'calculate_stay_subtotal',
    { p_room_type_id: roomTypeId, p_check_in: checkIn, p_check_out: checkOut }
  )
  if (subtotalError) {
    return { error: subtotalError.message, subtotal: 0, tax: 0, total: 0, nights: 0 }
  }

  const { data: tax } = await supabase.rpc('calculate_exclusive_tax', {
    p_subtotal: subtotal ?? 0,
  })

  const nights =
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)

  return { subtotal: subtotal ?? 0, tax: tax ?? 0, total: (subtotal ?? 0) + (tax ?? 0), nights }
}

export async function publicCreateReservation(formData: FormData) {
  const supabase = createServiceClient()

  const roomTypeId = String(formData.get('room_type_id'))
  const checkIn = String(formData.get('check_in'))
  const checkOut = String(formData.get('check_out'))
  const firstName = String(formData.get('guest_first_name') || '').trim()
  const lastName = String(formData.get('guest_last_name') || '').trim()
  const email = String(formData.get('guest_email') || '').trim()
  const phone = String(formData.get('guest_phone') || '').trim() || null

  if (!roomTypeId || !checkIn || !checkOut) return { error: 'Room type and dates are required.' }
  if (checkOut <= checkIn) return { error: 'Check-out must be after check-in.' }
  if (!firstName || !lastName) return { error: 'First and last name are required.' }
  if (!email) return { error: 'Email is required — used to look up your booking later.' }

  const { available, error: availError } = await publicCheckAvailability(
    roomTypeId,
    checkIn,
    checkOut
  )
  if (availError) return { error: availError }
  if (available <= 0) return { error: 'Sorry, no rooms of this type are available for those dates.' }

  // Find or create the guest by email (same pattern as the staff-side booking flow)
  const { data: existingGuest } = await supabase
    .from('guests')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  let guestId = existingGuest?.id

  if (!guestId) {
    const { data: newGuest, error: guestError } = await supabase
      .from('guests')
      .insert({ first_name: firstName, last_name: lastName, email, phone })
      .select('id')
      .single()
    if (guestError || !newGuest) {
      return { error: guestError?.message || 'Could not save guest details.' }
    }
    guestId = newGuest.id
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
    p_guest_id: guestId,
    p_room_type_id: roomTypeId,
    p_check_in: checkIn,
    p_check_out: checkOut,
    p_rate_applied: averageNightlyRate,
    p_total_amount: subtotal ?? 0,
    p_created_by: null,
  })
  if (rpcError) return { error: rpcError.message }

  const { data: taxAmount } = await supabase.rpc('calculate_exclusive_tax', {
    p_subtotal: subtotal ?? 0,
  })

  let folioId: string | null = null
  if (taxAmount && taxAmount > 0) {
    const { data: folio } = await supabase
      .from('folios')
      .select('id')
      .eq('reservation_id', reservationId)
      .single()
    if (folio) {
      folioId = folio.id
      await supabase.from('folio_line_items').insert({
        folio_id: folio.id,
        type: 'tax',
        description: 'Tax',
        amount: taxAmount,
      })
    }
  }

  // Send booking confirmation email — failures here never block the booking
  // itself, since sendEmail() swallows and logs its own errors.
  const [{ data: roomType }, { data: createdReservation }] = await Promise.all([
    supabase.from('room_types').select('name').eq('id', roomTypeId).single(),
    supabase.from('reservations').select('confirmation_code').eq('id', reservationId).single(),
  ])

  const confirmationCode = createdReservation?.confirmation_code || reservationId

  await sendEmail(
    email,
    'Your booking is confirmed',
    bookingConfirmationEmail({
      guestName: firstName,
      roomTypeName: roomType?.name || 'your room',
      checkIn,
      checkOut,
      totalAmount: (subtotal ?? 0) + (taxAmount ?? 0),
      confirmationCode,
    })
  )

  return { success: true, reservationId, confirmationCode, folioId }
}

export async function publicJoinWaitlist(formData: FormData) {
  const supabase = createServiceClient()

  const roomTypeId = String(formData.get('room_type_id'))
  const checkIn = String(formData.get('check_in'))
  const checkOut = String(formData.get('check_out'))
  const firstName = String(formData.get('guest_first_name') || '').trim()
  const lastName = String(formData.get('guest_last_name') || '').trim()
  const email = String(formData.get('guest_email') || '').trim()
  const phone = String(formData.get('guest_phone') || '').trim() || null

  if (!roomTypeId || !checkIn || !checkOut) return { error: 'Room type and dates are required.' }
  if (!firstName || !lastName || !email) return { error: 'Name and email are required.' }

  const { data: existingGuest } = await supabase
    .from('guests')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  let guestId = existingGuest?.id

  if (!guestId) {
    const { data: newGuest, error: guestError } = await supabase
      .from('guests')
      .insert({ first_name: firstName, last_name: lastName, email, phone })
      .select('id')
      .single()
    if (guestError || !newGuest) return { error: guestError?.message || 'Could not save guest.' }
    guestId = newGuest.id
  }

  const { error } = await supabase.from('waitlist_entries').insert({
    guest_id: guestId,
    room_type_id: roomTypeId,
    check_in: checkIn,
    check_out: checkOut,
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function publicLookupReservation(confirmationCode: string, email: string) {
  if (!confirmationCode || !email) {
    return { error: 'Booking reference and email are required.' }
  }

  const supabase = createServiceClient()

  const { data: reservation } = await supabase
    .from('reservations')
    .select('*, guests(first_name, last_name, email), room_types(name)')
    .eq('confirmation_code', confirmationCode.toUpperCase().trim())
    .single()

  if (!reservation || reservation.guests?.email?.toLowerCase() !== email.toLowerCase().trim()) {
    // Deliberately vague — don't reveal whether the code exists but the email
    // didn't match, vs. the code not existing at all.
    return { error: 'No booking found matching that reference and email.' }
  }

  return { reservation }
}

export async function publicCancelReservation(confirmationCode: string, email: string) {
  const lookup = await publicLookupReservation(confirmationCode, email)
  if (lookup.error || !lookup.reservation) return { error: lookup.error }

  if (!['pending', 'confirmed'].includes(lookup.reservation.status)) {
    return { error: 'This booking can no longer be cancelled online — please contact the hotel.' }
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('reservations')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', lookup.reservation.id)

  if (error) return { error: error.message }

  await sendEmail(
    email,
    'Your booking has been cancelled',
    cancellationEmail({
      guestName: lookup.reservation.guests?.first_name || 'Guest',
      roomTypeName: lookup.reservation.room_types?.name || 'your room',
      checkIn: lookup.reservation.check_in,
      checkOut: lookup.reservation.check_out,
    })
  )

  return { success: true }
}