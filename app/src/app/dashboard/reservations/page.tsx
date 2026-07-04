import { createClient } from '@/lib/supabase/server'
import { getCurrentStaff } from '@/lib/get-current-staff'
import { NewReservationForm } from '@/components/reservations/new-reservation-form'
import { ReservationsTable } from '@/components/reservations/reservations-table'
import type { Enums } from '@/lib/database.types'

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; guest?: string }>
}) {
  const staff = await getCurrentStaff()
  const supabase = await createClient()
  const params = await searchParams

  const { data: roomTypes } = await supabase
    .from('room_types')
    .select('*')
    .eq('is_active', true)
    .order('base_rate')

  let query = supabase
    .from('reservations')
    .select('*, guests(first_name, last_name), room_types(name)')
    .order('check_in', { ascending: false })

  if (params.status) {
    query = query.eq('status', params.status as Enums<'reservation_status'>)
  }

  const { data: reservations } = await query

  const filteredByGuest = params.guest
    ? (reservations || []).filter((r) => {
        const name = `${r.guests?.first_name ?? ''} ${r.guests?.last_name ?? ''}`.toLowerCase()
        return name.includes(params.guest!.toLowerCase())
      })
    : reservations || []

  const canManage = staff.role === 'admin' || staff.role === 'front_desk'

  const STATUS_OPTIONS: Enums<'reservation_status'>[] = [
    'pending',
    'confirmed',
    'checked_in',
    'checked_out',
    'cancelled',
    'no_show',
  ]

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Reservations</h1>
        {canManage && <NewReservationForm roomTypes={roomTypes || []} />}
      </div>

      <form className="mb-4 flex gap-3" method="get">
        <input
          name="guest"
          placeholder="Search by guest name..."
          defaultValue={params.guest || ''}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
        <select
          name="status"
          defaultValue={params.status || ''}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          Filter
        </button>
      </form>

      <ReservationsTable reservations={filteredByGuest} canManage={canManage} />
    </div>
  )
}