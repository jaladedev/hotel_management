import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaff } from '@/lib/get-current-staff'
import { toCsv } from '@/lib/csv'

export async function GET() {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can export data.' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: guests, error } = await supabase
    .from('guests')
    .select('*')
    .order('created_at')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const csv = toCsv(guests || [], [
    'id',
    'first_name',
    'last_name',
    'email',
    'phone',
    'id_type',
    'id_number',
    'is_repeat_guest',
    'notes',
    'created_at',
  ])

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="guests-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}