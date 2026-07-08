import { createServiceClient } from '@/lib/supabase/service'

const PAYSTACK_BASE_URL = 'https://api.paystack.co'

export async function initializePaystackTransaction({
  email,
  amount,
  reference,
  callbackUrl,
}: {
  email: string
  amount: number // in the currency's major unit (e.g. Naira), converted to kobo below
  reference: string
  callbackUrl: string
}) {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: Math.round(amount * 100), // Paystack expects kobo (smallest unit)
      reference,
      callback_url: callbackUrl,
    }),
  })

  const data = await response.json()

  if (!response.ok || !data.status) {
    throw new Error(data.message || 'Failed to initialize Paystack transaction')
  }

  return data.data as { authorization_url: string; access_code: string; reference: string }
}

export async function initiatePaystackRefund(transactionReference: string, amount: number) {
  const response = await fetch(`${PAYSTACK_BASE_URL}/refund`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transaction: transactionReference,
      amount: Math.round(amount * 100),
    }),
  })

  const data = await response.json()

  if (!response.ok || !data.status) {
    throw new Error(data.message || 'Failed to initiate Paystack refund')
  }

  return data.data as { reference?: string; status: string }
}

// Called from the webhook when Paystack confirms a refund. Idempotent like
// settlePaystackPayment — a refund already marked 'processed' is a no-op.
export async function settlePaystackRefund(refundReference: string) {
  const supabase = createServiceClient()

  const { data: refund } = await supabase
    .from('refunds')
    .select('id, folio_id, amount, reason, status')
    .eq('paystack_refund_reference', refundReference)
    .single()

  if (!refund) {
    return { error: `No refund found for reference ${refundReference}` }
  }

  if (refund.status === 'processed') {
    return { success: true, alreadySettled: true }
  }

  await supabase
    .from('refunds')
    .update({ status: 'processed', processed_at: new Date().toISOString() })
    .eq('id', refund.id)

  await supabase.from('folio_line_items').insert({
    folio_id: refund.folio_id,
    type: 'refund',
    description: refund.reason ? `Paystack refund: ${refund.reason}` : 'Paystack refund',
    amount: refund.amount,
  })

  return { success: true, alreadySettled: false }
}

export async function verifyPaystackTransaction(reference: string) {
  const response = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    }
  )

  const data = await response.json()

  if (!response.ok || !data.status) {
    throw new Error(data.message || 'Failed to verify Paystack transaction')
  }

  return data.data as { status: string; reference: string; amount: number }
}

// Shared settlement logic — called from BOTH the callback route (immediate,
// user-facing) and the webhook route (authoritative, async-safe). Idempotent:
// if the payment is already 'success', it's a no-op on the second call.
export async function settlePaystackPayment(reference: string) {
  const supabase = createServiceClient()

  const { data: payment } = await supabase
    .from('payments')
    .select('id, folio_id, amount, status')
    .eq('paystack_reference', reference)
    .single()

  if (!payment) {
    return { error: `No payment found for reference ${reference}` }
  }

  if (payment.status === 'success') {
    return { success: true, alreadySettled: true }
  }

  const verification = await verifyPaystackTransaction(reference)

  if (verification.status !== 'success') {
    await supabase.from('payments').update({ status: 'failed' }).eq('id', payment.id)
    return { error: `Paystack transaction status: ${verification.status}` }
  }

  // Sanity check: verified amount (kobo) should match what we recorded (major unit)
  const verifiedMajorUnit = verification.amount / 100
  if (Math.abs(verifiedMajorUnit - payment.amount) > 0.01) {
    return { error: 'Amount mismatch between recorded payment and Paystack verification.' }
  }

  await supabase.from('payments').update({ status: 'success' }).eq('id', payment.id)

  await supabase.from('folio_line_items').insert({
    folio_id: payment.folio_id,
    type: 'payment',
    description: 'Payment via Paystack',
    amount: -payment.amount,
    payment_id: payment.id,
  })

  return { success: true, alreadySettled: false }
}