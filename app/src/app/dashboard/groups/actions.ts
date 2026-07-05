'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaff } from '@/lib/get-current-staff'

type RoomRequest = { roomTypeId: string; quantity: number }

export async function createGroupBooking(input: {
  name: string
  notes: string
  checkIn: string
  checkOut: string
  primaryGuest: { firstName: string; lastName: string; email: string; phone: string }
  rooms: RoomRequest[]
}) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin' && staff.role !== 'front_desk') {
    return { error: 'You do not have permission to create group bookings.' }
  }

  if (!input.name.trim()) return { error: 'Group name is required.' }
  if (input.checkOut <= input.checkIn) return { error: 'Check-out must be after check-in.' }
  if (input.rooms.length === 0 || input.rooms.every((r) => r.quantity <= 0)) {
    return { error: 'Add at least one room.' }
  }
  if (!input.primaryGuest.firstName || !input.primaryGuest.lastName || !input.primaryGuest.email) {
    return { error: 'Primary contact name and email are required.' }
  }

  const supabase = await createClient()

  // Find or create the primary contact guest
  const { data: existingGuest } = await supabase
    .from('guests')
    .select('id')
    .eq('email', input.primaryGuest.email)
    .maybeSingle()

  let guestId = existingGuest?.id

  if (!guestId) {
    const { data: newGuest, error: guestError } = await supabase
      .from('guests')
      .insert({
        first_name: input.primaryGuest.firstName,
        last_name: input.primaryGuest.lastName,
        email: input.primaryGuest.email,
        phone: input.primaryGuest.phone || null,
      })
      .select('id')
      .single()
    if (guestError || !newGuest) return { error: guestError?.message || 'Could not save guest.' }
    guestId = newGuest.id
  }

  const { data: group, error: groupError } = await supabase
    .from('group_bookings')
    .insert({
      name: input.name.trim(),
      primary_guest_id: guestId,
      notes: input.notes.trim() || null,
      created_by: staff.id,
    })
    .select('id')
    .single()

  if (groupError || !group) return { error: groupError?.message || 'Could not create group.' }

  // Create one reservation per requested unit. create_reservation() takes a
  // row lock and rechecks availability internally, so looping this
  // sequentially is race-safe — each call correctly sees the previous
  // iteration's booking already counted against availability.
  const createdReservationIds: string[] = []
  const failures: string[] = []

  for (const room of input.rooms) {
    for (let i = 0; i < room.quantity; i++) {
      const { data: subtotal, error: subtotalError } = await supabase.rpc(
        'calculate_stay_subtotal',
        { p_room_type_id: room.roomTypeId, p_check_in: input.checkIn, p_check_out: input.checkOut }
      )
      if (subtotalError) {
        failures.push(`Room type ${room.roomTypeId}: ${subtotalError.message}`)
        continue
      }

      const nights =
        (new Date(input.checkOut).getTime() - new Date(input.checkIn).getTime()) /
        (1000 * 60 * 60 * 24)
      const averageNightlyRate = (subtotal ?? 0) / nights

      const { data: reservationId, error: rpcError } = await supabase.rpc('create_reservation', {
        p_guest_id: guestId,
        p_room_type_id: room.roomTypeId,
        p_check_in: input.checkIn,
        p_check_out: input.checkOut,
        p_rate_applied: averageNightlyRate,
        p_total_amount: subtotal ?? 0,
        p_created_by: staff.id,
      })

      if (rpcError || !reservationId) {
        failures.push(rpcError?.message || 'Unknown error creating a room reservation.')
        continue
      }

      await supabase
        .from('reservations')
        .update({ group_booking_id: group.id })
        .eq('id', reservationId)

      createdReservationIds.push(reservationId)
    }
  }

  revalidatePath('/dashboard/groups')

  if (createdReservationIds.length === 0) {
    return { error: `No rooms could be booked. ${failures.join('; ')}` }
  }

  return {
    success: true,
    groupId: group.id,
    bookedCount: createdReservationIds.length,
    failures: failures.length > 0 ? failures : undefined,
  }
}