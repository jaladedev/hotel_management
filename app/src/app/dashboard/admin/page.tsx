import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaff } from '@/lib/get-current-staff'
import { HotelSettingsForm } from '@/components/admin/hotel-settings-form'
import { StaffTable } from '@/components/admin/staff-table'
import { InviteStaffForm } from '@/components/admin/invite-staff-form'

export default async function AdminPage() {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()

  const [{ data: settings }, { data: staffList }] = await Promise.all([
    supabase.from('hotel_settings').select('*').single(),
    supabase.from('staff').select('*').order('full_name'),
  ])

  return (
    <div className="space-y-10">
      <section>
        <h1 className="mb-4 font-display text-xl font-medium text-ink">Hotel Settings</h1>
        {settings && <HotelSettingsForm settings={settings} />}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-display text-xl font-medium text-ink">Staff</h1>
          <div className="flex gap-2">
            <Link
              href="/dashboard/admin/audit-log"
              className="rounded-md bg-paper-dim px-4 py-2 text-sm font-medium text-ink-soft hover:bg-rule/50"
            >
              Audit Log
            </Link>
            <InviteStaffForm />
          </div>
        </div>
        <StaffTable staffList={staffList || []} currentStaffId={staff.id} />
      </section>
    </div>
  )
}