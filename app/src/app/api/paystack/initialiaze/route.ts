import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaff } from '@/lib/get-current-staff'
import { initializePaystackTransaction } from '@/lib/paystack'

export async function POST(request: NextRequest) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin' && staff.role !== 'front_desk') {
    return NextResponse.json({ error: 'Not permitted.' }, { status: 403 })
  }

  const { folioId, amount } = await request.json()

  if (!folioId || !amount || amount <= 0) {
    return NextResponse.json({ error: 'folioId and a positive amount are required.' }, { status: 400 })
  }

  const supabase = await createClient()

  // Pull guest email for the Paystack transaction (required by their API)
  const { data: folio } = await supabase
    .from('folios')
    .select('reservation_id, reservations(guests(email))')
    .eq('id', folioId)
    .single()

  const guestEmail = (folio as unknown as {
    reservations: { guests: { email: string | null } | null } | null
  } | null)?.reservations?.guests?.email

  if (!guestEmail) {
    return NextResponse.json(
      { error: 'Guest has no email on file — required for Paystack payments.' },
      { status: 400 }
    )
  }

  const reference = `HTL-${randomUUID()}`

  // Create the payment row as 'pending' BEFORE redirecting, so we have
  // something to reconcile against when the webhook/callback fires.
  const { error: insertError } = await supabase.from('payments').insert({
    folio_id: folioId,
    method: 'paystack',
    amount,
    status: 'pending',
    paystack_reference: reference,
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  try {
    const callbackUrl = `${request.nextUrl.origin}/dashboard/folios/paystack-callback`
    const { authorization_url } = await initializePaystackTransaction({
      email: guestEmail,
      amount,
      reference,
      callbackUrl,
    })

    return NextResponse.json({ authorization_url })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to initialize payment.' },
      { status: 500 }
    )
  }
}