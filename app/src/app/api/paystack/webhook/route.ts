import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { settlePaystackPayment, settlePaystackRefund } from '@/lib/paystack'

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-paystack-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature.' }, { status: 400 })
  }

  const expectedSignature = createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(rawBody)
    .digest('hex')

  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  const isValid =
    signatureBuffer.length === expectedBuffer.length &&
    timingSafeEqual(signatureBuffer, expectedBuffer)

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 })
  }

  const event = JSON.parse(rawBody)

  if (event.event === 'charge.success') {
    const reference = event.data?.reference
    if (reference) {
      const result = await settlePaystackPayment(reference)
      if (result.error) {
        // Log but still return 200 — Paystack retries on non-2xx, and a
        // reference lookup failure won't fix itself on retry.
        console.error('Paystack settlement error:', result.error)
      }
    }
  }

  if (event.event === 'refund.processed') {
    const refundReference = event.data?.reference || event.data?.transaction_reference
    if (refundReference) {
      const result = await settlePaystackRefund(refundReference)
      if (result.error) {
        console.error('Paystack refund settlement error:', result.error)
      }
    }
  }

  // Always acknowledge receipt so Paystack doesn't retry unnecessarily.
  return NextResponse.json({ received: true })
}