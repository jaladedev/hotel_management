import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaff } from '@/lib/get-current-staff'
import { toCsv } from '@/lib/csv'

export async function GET(request: NextRequest) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can export data.' }, { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const start = searchParams.get('start') || '1970-01-01'
  const end = searchParams.get('end') || new Date().toISOString().slice(0, 10)

  const supabase = await createClient()
  const { data: payments, error } = await supabase
    .from('payments')
    .select(
      'id, amount, currency, method, status, is_security_deposit, paystack_reference, created_at, folios(reservation_id, reservations(guests(first_name, last_name), check_in, check_out))'
    )
    .gte('created_at', `${start}T00:00:00Z`)
    .lte('created_at', `${end}T23:59:59Z`)
    .order('created_at')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const flattened = (payments || []).map((p) => {
    const reservation = (
      p as unknown as {
        folios: {
          reservation_id: string
          reservations: {
            guests: { first_name: string; last_name: string } | null
            check_in: string
            check_out: string
          } | null
        } | null
      }
    ).folios?.reservations

    return {
      id: p.id,
      date: p.created_at,
      guest_name: reservation?.guests
        ? `${reservation.guests.first_name} ${reservation.guests.last_name}`
        : '',
      check_in: reservation?.check_in || '',
      check_out: reservation?.check_out || '',
      method: p.method,
      status: p.status,
      is_security_deposit: p.is_security_deposit,
      amount: p.amount,
      currency: p.currency,
      paystack_reference: p.paystack_reference || '',
    }
  })

  const csv = toCsv(flattened, [
    'id',
    'date',
    'guest_name',
    'check_in',
    'check_out',
    'method',
    'status',
    'is_security_deposit',
    'amount',
    'currency',
    'paystack_reference',
  ])

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="financial-export-${start}-to-${end}.csv"`,
    },
  })
}