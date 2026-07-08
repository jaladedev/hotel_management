import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NewLostFoundForm } from '@/components/housekeeping/new-lost-found-form'
import { LostFoundTable } from '@/components/housekeeping/lost-found-table'

export default async function LostFoundPage() {
  const supabase = await createClient()

  const [{ data: items }, { data: rooms }] = await Promise.all([
    supabase
      .from('lost_found_items')
      .select('*, rooms(room_number)')
      .order('found_at', { ascending: false }),
    supabase.from('rooms').select('*').order('room_number'),
  ])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/housekeeping"
            className="text-xs font-medium text-ink-soft hover:text-indigo-700"
          >
            ← Back to tasks
          </Link>
          <h1 className="mt-1 font-display text-xl font-medium text-ink">Lost &amp; Found</h1>
        </div>
        <NewLostFoundForm rooms={rooms || []} />
      </div>
      <LostFoundTable items={items || []} />
    </div>
  )
}