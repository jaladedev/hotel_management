import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NewTaskForm } from '@/components/housekeeping/new-task-form'
import { TaskList } from '@/components/housekeeping/task-list'

export default async function HousekeepingPage() {
  const supabase = await createClient()

  const [{ data: tasks }, { data: rooms }, { data: staffList }] = await Promise.all([
    supabase
      .from('housekeeping_tasks')
      .select('*, rooms(room_number), staff!housekeeping_tasks_assigned_to_fkey(full_name)')
      .neq('status', 'done')
      .order('created_at', { ascending: false }),
    supabase.from('rooms').select('*').order('room_number'),
    supabase.from('staff').select('*').eq('is_active', true).order('full_name'),
  ])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-xl font-medium text-ink">Housekeeping Tasks</h1>
        <div className="flex gap-2">
          <Link
            href="/dashboard/housekeeping/lost-found"
            className="rounded-md bg-paper-dim px-4 py-2 text-sm font-medium text-ink-soft hover:bg-rule/50"
          >
            Lost &amp; Found
          </Link>
          <NewTaskForm rooms={rooms || []} staffList={staffList || []} />
        </div>
      </div>
      <TaskList tasks={tasks || []} />
    </div>
  )
}