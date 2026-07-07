'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaff } from '@/lib/get-current-staff'

// ---------- Event Spaces ----------

export async function createEventSpace(formData: FormData) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin') return { error: 'Only admins can manage event spaces.' }

  const supabase = await createClient()
  const { error } = await supabase.from('event_spaces').insert({
    name: String(formData.get('name')),
    capacity: Number(formData.get('capacity')),
    hourly_rate: Number(formData.get('hourly_rate')),
    description: String(formData.get('description') || '') || null,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/events')
  return { success: true }
}

// ---------- Event Bookings ----------

export async function checkEventSpaceAvailability(
  eventSpaceId: string,
  eventDate: string,
  startTime: string,
  endTime: string,
  excludeBookingId?: string
) {
  if (!eventSpaceId || !eventDate || !startTime || !endTime) return { available: false }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('check_event_space_availability', {
    p_event_space_id: eventSpaceId,
    p_event_date: eventDate,
    p_start_time: startTime,
    p_end_time: endTime,
    p_exclude_booking_id: excludeBookingId ?? null,
  })

  if (error) return { error: error.message, available: false }
  return { available: data ?? false }
}

export async function createEventBooking(input: {
  eventSpaceId: string
  eventName: string
  eventDate: string
  startTime: string
  endTime: string
  setupType: string
  headcount: number
  cateringNotes: string
  linkedReservationId?: string
  contact: { firstName: string; lastName: string; email: string; phone: string }
}) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin' && staff.role !== 'front_desk') {
    return { error: 'You do not have permission to create event bookings.' }
  }

  if (input.endTime <= input.startTime) return { error: 'End time must be after start time.' }
  if (!input.contact.firstName || !input.contact.lastName || !input.contact.email) {
    return { error: 'Contact name and email are required.' }
  }

  const supabase = await createClient()

  const { available, error: availError } = await checkEventSpaceAvailability(
    input.eventSpaceId,
    input.eventDate,
    input.startTime,
    input.endTime
  )
  if (availError) return { error: availError }
  if (!available) return { error: 'This event space is already booked for that time window.' }

  const { data: eventSpace } = await supabase
    .from('event_spaces')
    .select('hourly_rate')
    .eq('id', input.eventSpaceId)
    .single()
  if (!eventSpace) return { error: 'Event space not found.' }

  const [startH, startM] = input.startTime.split(':').map(Number)
  const [endH, endM] = input.endTime.split(':').map(Number)
  const hours = (endH * 60 + endM - (startH * 60 + startM)) / 60
  const rateQuoted = eventSpace.hourly_rate * hours

  const { data: existingGuest } = await supabase
    .from('guests')
    .select('id')
    .eq('email', input.contact.email)
    .maybeSingle()

  let guestId = existingGuest?.id
  if (!guestId) {
    const { data: newGuest, error: guestError } = await supabase
      .from('guests')
      .insert({
        first_name: input.contact.firstName,
        last_name: input.contact.lastName,
        email: input.contact.email,
        phone: input.contact.phone || null,
      })
      .select('id')
      .single()
    if (guestError || !newGuest) return { error: guestError?.message || 'Could not save contact.' }
    guestId = newGuest.id
  }

  const { data: booking, error } = await supabase
    .from('event_bookings')
    .insert({
      event_space_id: input.eventSpaceId,
      contact_guest_id: guestId,
      linked_reservation_id: input.linkedReservationId || null,
      event_name: input.eventName,
      event_date: input.eventDate,
      start_time: input.startTime,
      end_time: input.endTime,
      setup_type: input.setupType || null,
      headcount: input.headcount || null,
      catering_notes: input.cateringNotes || null,
      rate_quoted: rateQuoted,
      status: 'confirmed',
      created_by: staff.id,
    })
    .select('id')
    .single()

  if (error || !booking) return { error: error?.message || 'Could not create event booking.' }

  revalidatePath('/dashboard/events')
  return { success: true, bookingId: booking.id }
}

export async function settleEventBooking(bookingId: string, formData: FormData) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin' && staff.role !== 'front_desk') {
    return { error: 'You do not have permission to settle event bookings.' }
  }

  const supabase = await createClient()

  const { data: booking } = await supabase
    .from('event_bookings')
    .select('*')
    .eq('id', bookingId)
    .single()
  if (!booking) return { error: 'Booking not found.' }

  if (booking.linked_reservation_id) {
    const { data: folio } = await supabase
      .from('folios')
      .select('id')
      .eq('reservation_id', booking.linked_reservation_id)
      .single()

    if (folio) {
      await supabase.from('folio_line_items').insert({
        folio_id: folio.id,
        type: 'incidental',
        description: `Event space charge: ${booking.event_name}`,
        amount: booking.rate_quoted,
        created_by: staff.id,
      })
    }
  } else {
    const method = String(formData.get('paid_method') || 'cash')
    await supabase
      .from('event_bookings')
      .update({ paid_amount: booking.rate_quoted, paid_method: method as never })
      .eq('id', bookingId)
  }

  const { error } = await supabase
    .from('event_bookings')
    .update({ status: 'completed' })
    .eq('id', bookingId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/events')
  revalidatePath(`/dashboard/events/${bookingId}`)
  return { success: true }
}

export async function cancelEventBooking(bookingId: string) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin' && staff.role !== 'front_desk') {
    return { error: 'You do not have permission to cancel event bookings.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('event_bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/events')
  return { success: true }
}