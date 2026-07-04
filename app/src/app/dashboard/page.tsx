import { getCurrentStaff } from '@/lib/get-current-staff'

export default async function DashboardOverviewPage() {
  const staff = await getCurrentStaff()

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">
        Welcome, {staff.full_name.split(' ')[0]}
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        Overview widgets (today&apos;s arrivals/departures, occupancy) go here.
      </p>
    </div>
  )
}