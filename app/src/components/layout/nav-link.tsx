'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))

  return (
    <Link
      href={href}
      className={`relative block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? 'bg-indigo-800 text-paper'
          : 'text-indigo-100/70 hover:bg-indigo-800/60 hover:text-paper'
      }`}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-brass-500" />
      )}
      {label}
    </Link>
  )
}