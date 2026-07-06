import { getCurrentStaff } from '@/lib/get-current-staff'
import { SignOutButton } from '@/components/layout/sign-out-button'
import { NavLink } from '@/components/layout/nav-link'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', roles: ['admin', 'front_desk', 'housekeeping'] },
  { href: '/dashboard/reservations', label: 'Reservations', roles: ['admin', 'front_desk'] },
  { href: '/dashboard/guests', label: 'Guests', roles: ['admin', 'front_desk'] },
  { href: '/dashboard/groups', label: 'Groups', roles: ['admin', 'front_desk'] },
  { href: '/dashboard/waitlist', label: 'Waitlist', roles: ['admin', 'front_desk'] },
  { href: '/dashboard/reservations/calendar', label: 'Calendar', roles: ['admin', 'front_desk'] },
  { href: '/dashboard/rooms/board', label: 'Room Board', roles: ['admin', 'front_desk', 'housekeeping'] },
  { href: '/dashboard/rooms', label: 'Rooms', roles: ['admin', 'front_desk', 'housekeeping'] },
  { href: '/dashboard/folios', label: 'Folios', roles: ['admin', 'front_desk'] },
  { href: '/dashboard/housekeeping', label: 'Housekeeping', roles: ['admin', 'housekeeping'] },
  { href: '/dashboard/reports', label: 'Reports', roles: ['admin'] },
  { href: '/dashboard/admin', label: 'Admin', roles: ['admin'] },
  { href: '/dashboard/admin/rates', label: 'Rates & Tax', roles: ['admin'] },
] as const

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const staff = await getCurrentStaff()

  const visibleNavItems = NAV_ITEMS.filter((item) =>
    (item.roles as readonly string[]).includes(staff.role)
  )

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col bg-indigo-900">
        <div className="border-b border-indigo-700 px-4 py-4">
          <p className="font-display text-sm font-medium text-paper">{staff.full_name}</p>
          <p className="font-mono text-xs capitalize text-brass-400">
            {staff.role.replace('_', ' ')}
          </p>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-4">
          {visibleNavItems.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>

        <div className="border-t border-indigo-700 px-4 py-4">
          <SignOutButton />
        </div>
      </aside>

      <main className="flex-1 bg-paper-dim p-8">{children}</main>
    </div>
  )
}