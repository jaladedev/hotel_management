'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaff } from '@/lib/get-current-staff'

export async function sendPendingWaitlistNotifications() {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin' && staff.role !== 'front_desk') {
    return { error: 'You do not have permission to send waitlist notifications.' }
  }

  const supabase = await createClient()

  const { data: pending } = await supabase
    .from('waitlist_entries')
    .select('id, check_in, check_out, guests(first_name, email), room_types(name)')
    .eq('status', 'notified')
    .is('notified_at', null)

  if (!pending || pending.length === 0) {
    return { success: true, count: 0 }
  }

  const { waitlistAvailabilityEmail, sendEmail } = await import('@/lib/email')

  let sentCount = 0
  let failedCount = 0

  for (const entry of pending) {
    if (!entry.guests?.email) continue

    const result = await sendEmail(
      entry.guests.email,
      'A room may be available for your dates',
      waitlistAvailabilityEmail({
        guestName: entry.guests.first_name,
        roomTypeName: entry.room_types?.name || 'your requested room',
        checkIn: entry.check_in,
        checkOut: entry.check_out,
      })
    )

    // Only stamp notified_at when the send actually succeeded (or was
    // intentionally skipped due to missing config). A real failure leaves
    // notified_at null so it's retried next run.
    if (result.success || result.skipped) {
      await supabase
        .from('waitlist_entries')
        .update({ notified_at: new Date().toISOString() })
        .eq('id', entry.id)
      sentCount++
    } else {
      failedCount++
    }
  }

  revalidatePath('/dashboard/waitlist')
  return { success: true, count: sentCount, failed: failedCount }
}

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

  // If the reservation was created but we couldn't update the waitlist
  // entry, roll the reservation back rather than leaving a phantom booking
  // with no waitlist record pointing to it.
  if (updateError) {
    const { error: rollbackError } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', reservationId)

    if (rollbackError) {
      return {
        error: `Reservation ${reservationId} was created but the waitlist entry ` +
          `could not be updated, and automatic rollback also failed. ` +
          `Manual reconciliation required. (${updateError.message})`,
      }
    }

    return { error: `Could not finalize promotion, reservation was rolled back: ${updateError.message}` }
  }

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

  // Atomic upsert on email closes the check-then-insert race where two
  // concurrent submissions for the same new email could create duplicate
  // guest rows. Requires a unique constraint on guests.email.
  const { data: guest, error: guestError } = await supabase
    .from('guests')
    .upsert(
      {
        email,
        first_name: firstName,
        last_name: lastName,
        phone: String(formData.get('guest_phone') || '') || null,
      },
      { onConflict: 'email', ignoreDuplicates: false }
    )
    .select('id')
    .single()

  if (guestError || !guest) return { error: guestError?.message || 'Could not save guest.' }

  const { error } = await supabase.from('waitlist_entries').insert({
    guest_id: guest.id,
    room_type_id: roomTypeId,
    check_in: checkIn,
    check_out: checkOut,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/waitlist')
  return { success: true }
}