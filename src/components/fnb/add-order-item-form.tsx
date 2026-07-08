'use client'

import { useState, useTransition } from 'react'
import { addOrderItem } from '@/app/dashboard/fnb/actions'
import type { Tables } from '@/lib/database.types'

type MenuItemWithCategory = Tables<'menu_items'> & { menu_categories: { name: string } | null }

export function AddOrderItemForm({
  orderId,
  menuItems,
}: {
  orderId: string
  menuItems: MenuItemWithCategory[]
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await addOrderItem(orderId, formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form action={handleSubmit} className="flex items-end gap-2 rounded-lg border border-rule bg-white p-4">
      <div className="flex-1">
        <label className="mb-1 block text-xs font-medium text-ink-soft">Item</label>
        <select name="menu_item_id" required className="w-full rounded-md border border-rule px-3 py-1.5 text-sm">
          <option value="">Select...</option>
          {menuItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} — {item.price.toLocaleString()}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-soft">Qty</label>
        <input
          name="quantity"
          type="number"
          min={1}
          defaultValue={1}
          className="w-20 rounded-md border border-rule px-3 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-soft">Notes</label>
        <input name="notes" className="w-40 rounded-md border border-rule px-3 py-1.5 text-sm" />
      </div>
      {error && <p className="text-xs text-status-bad">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-indigo-700 px-4 py-1.5 text-sm font-medium text-paper hover:bg-indigo-800 disabled:opacity-50"
      >
        {isPending ? 'Adding...' : 'Add'}
      </button>
    </form>
  )
}