import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaff } from '@/lib/get-current-staff'
import { MenuCategoryForm } from '@/components/fnb/menu-category-form'
import { MenuItemForm } from '@/components/fnb/menu-item-form'
import { MenuItemsTable } from '@/components/fnb/menu-items-table'

export default async function MenuPage() {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()

  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase.from('menu_categories').select('*').order('sort_order'),
    supabase.from('menu_items').select('*, menu_categories(name)').order('name'),
  ])

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-display text-xl font-medium text-ink">Menu Categories</h1>
          <MenuCategoryForm />
        </div>
        <div className="flex flex-wrap gap-2">
          {(categories || []).map((c) => (
            <span
              key={c.id}
              className="rounded-full border border-rule bg-white px-3 py-1 text-sm text-ink-soft"
            >
              {c.name}
            </span>
          ))}
          {(categories || []).length === 0 && (
            <p className="text-ink-soft">No categories yet — add one to start building the menu.</p>
          )}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-display text-xl font-medium text-ink">Menu Items</h1>
          <MenuItemForm categories={categories || []} />
        </div>
        <MenuItemsTable items={items || []} />
      </section>
    </div>
  )
}