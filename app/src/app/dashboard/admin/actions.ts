'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getCurrentStaff } from '@/lib/get-current-staff'
import { logAudit } from '@/lib/audit'

// ---------- Hotel Settings ----------

export async function updateHotelSettings(formData: FormData) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin') return { error: 'Only admins can edit hotel settings.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('hotel_settings')
    .update({
      name: String(formData.get('name')),
      address: String(formData.get('address') || '') || null,
      phone: String(formData.get('phone') || '') || null,
      email: String(formData.get('email') || '') || null,
      currency: String(formData.get('currency') || 'NGN'),
      cancellation_policy: String(formData.get('cancellation_policy') || '') || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', true)

  if (error) return { error: error.message }

  await logAudit(staff.id, 'hotel_settings_updated', 'hotel_settings', null, {})

  revalidatePath('/dashboard/admin')
  return { success: true }
}

// ---------- Staff Management ----------

export async function inviteStaffMember(formData: FormData) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin') return { error: 'Only admins can invite staff.' }

  const email = String(formData.get('email') || '').trim()
  const fullName = String(formData.get('full_name') || '').trim()
  const role = String(formData.get('role') || 'front_desk')

  if (!email || !fullName) return { error: 'Name and email are required.' }

  const serviceClient = createServiceClient()

  // Creates the auth user AND emails them a sign-in link — requires the
  // service role since regular sessions can't call the admin auth API.
  const { data: authUser, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(
    email
  )

  if (inviteError || !authUser.user) {
    return { error: inviteError?.message || 'Could not invite user.' }
  }

  const { error: staffError } = await serviceClient.from('staff').insert({
    id: authUser.user.id,
    full_name: fullName,
    role: role as never,
  })

  if (staffError) return { error: staffError.message }

  await logAudit(staff.id, 'staff_invited', 'staff', authUser.user.id, { email, role })

  revalidatePath('/dashboard/admin')
  return { success: true }
}

export async function toggleStaffActive(staffId: string, isActive: boolean) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin') return { error: 'Only admins can manage staff.' }
  if (staffId === staff.id) return { error: 'You cannot deactivate your own account.' }

  const supabase = await createClient()
  const { error } = await supabase.from('staff').update({ is_active: isActive }).eq('id', staffId)

  if (error) return { error: error.message }

  await logAudit(staff.id, isActive ? 'staff_reactivated' : 'staff_deactivated', 'staff', staffId, {})

  revalidatePath('/dashboard/admin')
  return { success: true }
}

export async function updateStaffRole(staffId: string, role: string) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin') return { error: 'Only admins can manage staff.' }
  if (staffId === staff.id) return { error: 'You cannot change your own role.' }

  const supabase = await createClient()
  const { error } = await supabase.from('staff').update({ role: role as never }).eq('id', staffId)

  if (error) return { error: error.message }

  await logAudit(staff.id, 'staff_role_changed', 'staff', staffId, { newRole: role })

  revalidatePath('/dashboard/admin')
  return { success: true }
}