'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaff } from '@/lib/get-current-staff'

export async function updateGuestNotes(guestId: string, formData: FormData) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin' && staff.role !== 'front_desk') {
    return { error: 'You do not have permission to edit guest notes.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('guests')
    .update({
      notes: String(formData.get('notes') || '').trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', guestId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/guests/${guestId}`)
  return { success: true }
}