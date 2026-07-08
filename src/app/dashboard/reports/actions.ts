'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaff } from '@/lib/get-current-staff'

export async function recordCashReconciliation(formData: FormData) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin') {
    return { error: 'Only admins can record cash reconciliations.' }
  }

  const date = String(formData.get('date'))
  const expectedCash = Number(formData.get('expected_cash'))
  const countedCash = Number(formData.get('counted_cash'))
  const notes = String(formData.get('notes') || '').trim() || null

  if (!date) return { error: 'Date is required.' }
  if (Number.isNaN(expectedCash) || Number.isNaN(countedCash)) {
    return { error: 'Enter valid amounts.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.from('cash_reconciliations').upsert(
    {
      reconciliation_date: date,
      expected_cash: expectedCash,
      counted_cash: countedCash,
      notes,
      recorded_by: staff.id,
    },
    { onConflict: 'reconciliation_date' }
  )

  if (error) return { error: error.message }

  revalidatePath('/dashboard/reports')
  return { success: true }
}