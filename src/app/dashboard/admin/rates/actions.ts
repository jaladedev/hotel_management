'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaff } from '@/lib/get-current-staff'

// ---------- Rate Plans ----------

export async function createRatePlan(formData: FormData) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin') return { error: 'Only admins can manage rate plans.' }

  const startDate = String(formData.get('start_date'))
  const endDate = String(formData.get('end_date'))
  if (endDate < startDate) return { error: 'End date must be on or after start date.' }

  const supabase = await createClient()
  const { error } = await supabase.from('rate_plans').insert({
    room_type_id: String(formData.get('room_type_id')),
    name: String(formData.get('name')),
    start_date: startDate,
    end_date: endDate,
    nightly_rate: Number(formData.get('nightly_rate')),
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/admin/rates')
  return { success: true }
}

export async function deleteRatePlan(id: string) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin') return { error: 'Only admins can manage rate plans.' }

  const supabase = await createClient()
  const { error } = await supabase.from('rate_plans').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/admin/rates')
  return { success: true }
}

// ---------- Tax Rules ----------

export async function createTaxRule(formData: FormData) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin') return { error: 'Only admins can manage tax rules.' }

  const supabase = await createClient()
  const { error } = await supabase.from('tax_rules').insert({
    name: String(formData.get('name')),
    rate_percent: Number(formData.get('rate_percent')),
    is_inclusive: formData.get('is_inclusive') === 'on',
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/admin/rates')
  return { success: true }
}

export async function toggleTaxRuleActive(id: string, isActive: boolean) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin') return { error: 'Only admins can manage tax rules.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('tax_rules')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/admin/rates')
  return { success: true }
}