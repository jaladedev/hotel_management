import { createClient } from '@/lib/supabase/server'
import { NewTableForm } from '@/components/fnb/new-table-form'
import { TableStatusGrid } from '@/components/fnb/table-status-grid'

export default async function TablesPage() {
  const supabase = await createClient()
  const { data: tables } = await supabase.from('restaurant_tables').select('*').order('table_number')

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-xl font-medium text-ink">Tables</h1>
        <NewTableForm />
      </div>
      <TableStatusGrid tables={tables || []} />
    </div>
  )
}