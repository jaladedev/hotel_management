'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaff } from '@/lib/get-current-staff'

export async function promoteWaitlistEntry(waitlistId: string) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin' && staff.role !== 'front_desk') {
    return { error: 'You do not have permission to promote waitlist entries.' }
  }

  const supabase = await createClient()

  const { data: entry } = await supabase
    .from('waitlist_entries')
    .select('*')
    .eq('id', waitlistId)
    .single()

  if (!entry || !['waiting', 'notified'].includes(entry.status)) {
    return { error: 'This entry can no longer be promoted.' }
  }

  const { data: available, error: availError } = await supabase.rpc('check_availability', {
    p_room_type_id: entry.room_type_id,
    p_check_in: entry.check_in,
    p_check_out: entry.check_out,
  })
  if (availError) return { error: availError.message }
  if (!available || available <= 0) {
    return { error: 'No rooms available for these dates — cannot promote yet.' }
  }

  const { data: subtotal, error: subtotalError } = await supabase.rpc(
    'calculate_stay_subtotal',
    { p_room_type_id: entry.room_type_id, p_check_in: entry.check_in, p_check_out: entry.check_out }
  )
  if (subtotalError) return { error: subtotalError.message }

  const nights =
    (new Date(entry.check_out).getTime() - new Date(entry.check_in).getTime()) /
    (1000 * 60 * 60 * 24)
  const averageNightlyRate = (subtotal ?? 0) / nights

  const { data: reservationId, error: rpcError } = await supabase.rpc('create_reservation', {
    p_guest_id: entry.guest_id,
    p_room_type_id: entry.room_type_id,
    p_check_in: entry.check_in,
    p_check_out: entry.check_out,
    p_rate_applied: averageNightlyRate,
    p_total_amount: subtotal ?? 0,
    p_created_by: staff.id,
  })
  if (rpcError) return { error: rpcError.message }

  const { error: updateError } = await supabase
    .from('waitlist_entries')
    .update({ status: 'promoted', promoted_reservation_id: reservationId })
    .eq('id', waitlistId)
  if (updateError) return { error: updateError.message }

  revalidatePath('/dashboard/waitlist')
  return { success: true, reservationId }
}

export async function cancelWaitlistEntry(waitlistId: string) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin' && staff.role !== 'front_desk') {
    return { error: 'You do not have permission to update the waitlist.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('waitlist_entries')
    .update({ status: 'cancelled' })
    .eq('id', waitlistId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/waitlist')
  return { success: true }
}

export async function addWaitlistEntry(formData: FormData) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin' && staff.role !== 'front_desk') {
    return { error: 'You do not have permission to add to the waitlist.' }
  }

  const supabase = await createClient()

  const email = String(formData.get('guest_email') || '').trim()
  const firstName = String(formData.get('guest_first_name') || '').trim()
  const lastName = String(formData.get('guest_last_name') || '').trim()
  const roomTypeId = String(formData.get('room_type_id'))
  const checkIn = String(formData.get('check_in'))
  const checkOut = String(formData.get('check_out'))

  if (!firstName || !lastName || !email) return { error: 'Guest name and email are required.' }
  if (!roomTypeId || !checkIn || !checkOut) return { error: 'Room type and dates are required.' }
  if (checkOut <= checkIn) return { error: 'Check-out must be after check-in.' }

  const { data: existingGuest } = await supabase
    .from('guests')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  let guestId = existingGuest?.id
  if (!guestId) {
    const { data: newGuest, error: guestError } = await supabase
      .from('guests')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email,
        phone: String(formData.get('guest_phone') || '') || null,
      })
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

  revalidatePath('/dashboard/waitlist')
  return { success: true }
}