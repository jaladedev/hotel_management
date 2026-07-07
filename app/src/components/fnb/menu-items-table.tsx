'use client'

import { useTransition } from 'react'
import { toggleMenuItemAvailable } from '@/app/dashboard/fnb/actions'
import type { Tables } from '@/lib/database.types'

type MenuItemWithCategory = Tables<'menu_items'> & { menu_categories: { name: string } | null }

export function MenuItemsTable({ items }: { items: MenuItemWithCategory[] }) {
  const [isPending, startTransition] = useTransition()

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      await toggleMenuItemAvailable(id, !current)
    })
  }

  return (
    <table className="w-full overflow-hidden rounded-lg border border-rule bg-white text-sm">
      <thead className="bg-paper-dim text-left text-xs font-medium uppercase text-ink-soft">
        <tr>
          <th className="px-4 py-2">Name</th>
          <th className="px-4 py-2">Category</th>
          <th className="px-4 py-2">Price</th>
          <th className="px-4 py-2">Available</th>
          <th className="px-4 py-2"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-rule/60">
        {items.map((item) => (
          <tr key={item.id}>
            <td className="px-4 py-2 font-medium text-ink">
              {item.name}
              {item.description && <p className="text-xs text-ink-soft">{item.description}</p>}
            </td>
            <td className="px-4 py-2 text-ink-soft">{item.menu_categories?.name || '—'}</td>
            <td className="px-4 py-2 font-mono text-ink">{item.price.toLocaleString()}</td>
            <td className="px-4 py-2">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  item.is_available ? 'bg-status-good-bg text-status-good' : 'bg-status-neutral-bg text-status-neutral'
                }`}
              >
                {item.is_available ? 'Available' : 'Unavailable'}
              </span>
            </td>
            <td className="px-4 py-2">
              <button
                disabled={isPending}
                onClick={() => handleToggle(item.id, item.is_available)}
                className="text-xs font-medium text-ink-soft hover:text-indigo-700 disabled:opacity-50"
              >
                {item.is_available ? 'Mark unavailable' : 'Mark available'}
              </button>
            </td>
          </tr>
        ))}
        {items.length === 0 && (
          <tr>
            <td colSpan={5} className="px-4 py-6 text-center text-ink-soft/60">
              No menu items yet.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}