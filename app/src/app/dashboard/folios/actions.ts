'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaff } from '@/lib/get-current-staff'

export async function recordCashPayment(folioId: string, formData: FormData) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin' && staff.role !== 'front_desk') {
    return { error: 'You do not have permission to record payments.' }
  }

  const amount = Number(formData.get('amount'))
  if (!amount || amount <= 0) {
    return { error: 'Enter a valid amount.' }
  }

  const supabase = await createClient()

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      folio_id: folioId,
      method: 'cash',
      amount,
      status: 'success',
      recorded_by: staff.id,
    })
    .select('id')
    .single()

  if (paymentError || !payment) {
    return { error: paymentError?.message || 'Could not record payment.' }
  }

  const { error: lineItemError } = await supabase.from('folio_line_items').insert({
    folio_id: folioId,
    type: 'payment',
    description: `Cash payment received (recorded by ${staff.full_name})`,
    amount: -amount,
    payment_id: payment.id,
    created_by: staff.id,
  })

  if (lineItemError) return { error: lineItemError.message }

  revalidatePath('/dashboard/folios')
  revalidatePath('/dashboard/reservations')
  return { success: true }
}

export async function addIncidentalCharge(folioId: string, formData: FormData) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin' && staff.role !== 'front_desk') {
    return { error: 'You do not have permission to add charges.' }
  }

  const description = String(formData.get('description') || '').trim()
  const amount = Number(formData.get('amount'))

  if (!description) return { error: 'Description is required.' }
  if (!amount || amount <= 0) return { error: 'Enter a valid amount.' }

  const supabase = await createClient()

  const { error } = await supabase.from('folio_line_items').insert({
    folio_id: folioId,
    type: 'incidental',
    description,
    amount,
    created_by: staff.id,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/folios')
  return { success: true }
}