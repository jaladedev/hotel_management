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

// ---------- Security Deposits ----------
// Tracked directly on folios (security_deposit_amount/status), NOT as a
// folio_line_item — a held deposit is not part of what the guest owes.
// Cash-only: see migration notes for why Paystack isn't wired up here.

export async function collectSecurityDeposit(folioId: string, formData: FormData) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin' && staff.role !== 'front_desk') {
    return { error: 'You do not have permission to collect deposits.' }
  }

  const amount = Number(formData.get('amount'))
  if (!amount || amount <= 0) return { error: 'Enter a valid amount.' }

  const supabase = await createClient()

  const { error: paymentError } = await supabase.from('payments').insert({
    folio_id: folioId,
    method: 'cash',
    amount,
    status: 'success',
    recorded_by: staff.id,
    is_security_deposit: true,
  })
  if (paymentError) return { error: paymentError.message }

  const { error: folioError } = await supabase
    .from('folios')
    .update({ security_deposit_amount: amount, security_deposit_status: 'held' })
    .eq('id', folioId)
  if (folioError) return { error: folioError.message }

  revalidatePath('/dashboard/folios')
  return { success: true }
}

export async function releaseSecurityDeposit(folioId: string) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin' && staff.role !== 'front_desk') {
    return { error: 'You do not have permission to release deposits.' }
  }

  const supabase = await createClient()

  const { data: folio } = await supabase
    .from('folios')
    .select('security_deposit_amount, security_deposit_status')
    .eq('id', folioId)
    .single()

  if (!folio || folio.security_deposit_status !== 'held') {
    return { error: 'No held deposit to release for this folio.' }
  }

  const { error: refundError } = await supabase.from('refunds').insert({
    folio_id: folioId,
    method: 'cash',
    amount: folio.security_deposit_amount,
    reason: 'Security deposit released — no damage found',
    status: 'processed',
    processed_by: staff.id,
    processed_at: new Date().toISOString(),
  })
  if (refundError) return { error: refundError.message }

  const { error: folioError } = await supabase
    .from('folios')
    .update({ security_deposit_status: 'released' })
    .eq('id', folioId)
  if (folioError) return { error: folioError.message }

  revalidatePath('/dashboard/folios')
  return { success: true }
}

export async function chargeSecurityDeposit(folioId: string, formData: FormData) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin' && staff.role !== 'front_desk') {
    return { error: 'You do not have permission to charge deposits.' }
  }

  const supabase = await createClient()

  const { data: folio } = await supabase
    .from('folios')
    .select('security_deposit_amount, security_deposit_status')
    .eq('id', folioId)
    .single()

  if (!folio || folio.security_deposit_status !== 'held') {
    return { error: 'No held deposit to charge for this folio.' }
  }

  const description = String(formData.get('description') || '').trim()
  const damageAmount = Number(formData.get('amount'))
  if (!description) return { error: 'Description of the damage/charge is required.' }
  if (!damageAmount || damageAmount <= 0) return { error: 'Enter a valid amount.' }

  // The amount covered by the deposit is applied as an immediate offsetting
  // payment (the hotel is already holding that cash) — only any amount
  // ABOVE the deposit becomes real balance the guest still owes.
  const coveredByDeposit = Math.min(damageAmount, folio.security_deposit_amount)

  const { error: chargeError } = await supabase.from('folio_line_items').insert({
    folio_id: folioId,
    type: 'incidental',
    description: `Damage charge: ${description}`,
    amount: damageAmount,
    created_by: staff.id,
  })
  if (chargeError) return { error: chargeError.message }

  if (coveredByDeposit > 0) {
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        folio_id: folioId,
        method: 'cash',
        amount: coveredByDeposit,
        status: 'success',
        recorded_by: staff.id,
      })
      .select('id')
      .single()
    if (paymentError) return { error: paymentError.message }

    await supabase.from('folio_line_items').insert({
      folio_id: folioId,
      type: 'payment',
      description: 'Applied from held security deposit',
      amount: -coveredByDeposit,
      payment_id: payment.id,
      created_by: staff.id,
    })
  }

  const { error: folioError } = await supabase
    .from('folios')
    .update({ security_deposit_status: 'charged' })
    .eq('id', folioId)
  if (folioError) return { error: folioError.message }

  revalidatePath('/dashboard/folios')
  return { success: true }
}

// ---------- Refunds ----------

export async function refundCashPayment(folioId: string, formData: FormData) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin' && staff.role !== 'front_desk') {
    return { error: 'You do not have permission to issue refunds.' }
  }

  const amount = Number(formData.get('amount'))
  const reason = String(formData.get('reason') || '').trim()
  if (!amount || amount <= 0) return { error: 'Enter a valid amount.' }

  const supabase = await createClient()

  const { error: refundError } = await supabase.from('refunds').insert({
    folio_id: folioId,
    method: 'cash',
    amount,
    reason: reason || null,
    status: 'processed',
    processed_by: staff.id,
    processed_at: new Date().toISOString(),
  })
  if (refundError) return { error: refundError.message }

  // A refund reverses a payment, so it increases the balance the guest owes
  // (positive amount) — this is a deliberate ledger entry, not an error.
  const { error: lineItemError } = await supabase.from('folio_line_items').insert({
    folio_id: folioId,
    type: 'refund',
    description: reason ? `Cash refund: ${reason}` : 'Cash refund',
    amount,
    created_by: staff.id,
  })
  if (lineItemError) return { error: lineItemError.message }

  revalidatePath('/dashboard/folios')
  return { success: true }
}

export async function refundPaystackPayment(paymentId: string, formData: FormData) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin' && staff.role !== 'front_desk') {
    return { error: 'You do not have permission to issue refunds.' }
  }

  const amount = Number(formData.get('amount'))
  const reason = String(formData.get('reason') || '').trim()
  if (!amount || amount <= 0) return { error: 'Enter a valid amount.' }

  const supabase = await createClient()

  const { data: payment } = await supabase
    .from('payments')
    .select('folio_id, paystack_reference, amount, status')
    .eq('id', paymentId)
    .single()

  if (!payment || !payment.paystack_reference) {
    return { error: 'Original Paystack payment not found.' }
  }
  if (payment.status !== 'success') {
    return { error: 'Only successful payments can be refunded.' }
  }
  if (amount > payment.amount) {
    return { error: 'Refund amount cannot exceed the original payment.' }
  }

  const { initiatePaystackRefund } = await import('@/lib/paystack')

  let paystackRefundReference: string
  try {
    const result = await initiatePaystackRefund(payment.paystack_reference, amount)
    paystackRefundReference = result.reference ?? payment.paystack_reference
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to initiate Paystack refund.' }
  }

  // Paystack refunds are async — status starts 'pending' and is confirmed
  // via the 'refund.processed' webhook event, which then adds the
  // folio_line_item. We do NOT credit the guest's balance yet here.
  const { error: refundError } = await supabase.from('refunds').insert({
    payment_id: paymentId,
    folio_id: payment.folio_id,
    method: 'paystack',
    amount,
    reason: reason || null,
    status: 'pending',
    paystack_refund_reference: paystackRefundReference,
    processed_by: staff.id,
  })
  if (refundError) return { error: refundError.message }

  revalidatePath('/dashboard/folios')
  return { success: true, pending: true }
}