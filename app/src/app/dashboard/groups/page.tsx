import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaff } from '@/lib/get-current-staff'
import { NewGroupBookingForm } from '@/components/groups/new-group-booking-form'

export default async function GroupsPage() {
  const staff = await getCurrentStaff()
  const supabase = await createClient()

  const [{ data: groups }, { data: roomTypes }] = await Promise.all([
    supabase
      .from('group_bookings')
      .select('*, guests(first_name, last_name)')
      .order('created_at', { ascending: false }),
    supabase.from('room_types').select('*').eq('is_active', true).order('name'),
  ])

  const canManage = staff.role === 'admin' || staff.role === 'front_desk'

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Group Bookings</h1>
        {canManage && <NewGroupBookingForm roomTypes={roomTypes || []} />}
      </div>

      <table className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-sm">
        <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
          <tr>
            <th className="px-4 py-2">Group</th>
            <th className="px-4 py-2">Primary Contact</th>
            <th className="px-4 py-2">Created</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {(groups || []).map((g) => (
            <tr key={g.id}>
              <td className="px-4 py-2 font-medium text-gray-900">{g.name}</td>
              <td className="px-4 py-2 text-gray-600">
                {g.guests ? `${g.guests.first_name} ${g.guests.last_name}` : '—'}
              </td>
              <td className="px-4 py-2 text-gray-600">
                {new Date(g.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-2">
                <Link
                  href={`/dashboard/groups/${g.id}`}
                  className="text-xs font-medium text-blue-700 hover:text-blue-900"
                >
                  View details
                </Link>
              </td>
            </tr>
          ))}
          {(groups || []).length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                No group bookings yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}