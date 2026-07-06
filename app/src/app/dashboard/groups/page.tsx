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
        <h1 className="text-xl font-display font-medium text-ink">Group Bookings</h1>
        {canManage && <NewGroupBookingForm roomTypes={roomTypes || []} />}
      </div>

      <table className="w-full overflow-hidden rounded-lg border border-rule bg-white text-sm">
        <thead className="bg-paper-dim text-left text-xs font-medium uppercase text-ink-soft">
          <tr>
            <th className="px-4 py-2">Group</th>
            <th className="px-4 py-2">Primary Contact</th>
            <th className="px-4 py-2">Created</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule/60">
          {(groups || []).map((g) => (
            <tr key={g.id}>
              <td className="px-4 py-2 font-medium text-ink">{g.name}</td>
              <td className="px-4 py-2 text-ink-soft">
                {g.guests ? `${g.guests.first_name} ${g.guests.last_name}` : '—'}
              </td>
              <td className="px-4 py-2 text-ink-soft">
                {new Date(g.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-2">
                <Link
                  href={`/dashboard/groups/${g.id}`}
                  className="text-xs font-medium text-indigo-700 hover:text-indigo-800"
                >
                  View details
                </Link>
              </td>
            </tr>
          ))}
          {(groups || []).length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-ink-soft/60">
                No group bookings yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}