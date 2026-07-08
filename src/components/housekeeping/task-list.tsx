'use client'

import { useTransition } from 'react'
import { updateTaskStatus } from '@/app/dashboard/housekeeping/actions'
import type { Tables } from '@/lib/database.types'

type TaskWithJoins = Tables<'housekeeping_tasks'> & {
  rooms: { room_number: string } | null
  staff: { full_name: string } | null
}

const TASK_TYPE_STYLES: Record<string, string> = {
  cleaning: 'bg-status-info-bg text-status-info',
  inspection: 'bg-brass-100 text-brass-700',
  maintenance: 'bg-status-warn-bg text-status-warn',
}

export function TaskList({ tasks }: { tasks: TaskWithJoins[] }) {
  const [isPending, startTransition] = useTransition()

  function handleStatusChange(taskId: string, status: 'pending' | 'in_progress' | 'done') {
    startTransition(async () => {
      await updateTaskStatus(taskId, status)
    })
  }

  return (
    <table className="w-full overflow-hidden rounded-lg border border-rule bg-white text-sm">
      <thead className="bg-paper-dim text-left text-xs font-medium uppercase text-ink-soft">
        <tr>
          <th className="px-4 py-2">Room</th>
          <th className="px-4 py-2">Type</th>
          <th className="px-4 py-2">Assigned To</th>
          <th className="px-4 py-2">Notes</th>
          <th className="px-4 py-2">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-rule/60">
        {tasks.map((task) => (
          <tr key={task.id}>
            <td className="px-4 py-2 font-medium text-ink">Room {task.rooms?.room_number}</td>
            <td className="px-4 py-2">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${TASK_TYPE_STYLES[task.task_type]}`}
              >
                {task.task_type}
              </span>
            </td>
            <td className="px-4 py-2 text-ink-soft">{task.staff?.full_name || 'Unassigned'}</td>
            <td className="px-4 py-2 text-ink-soft">{task.notes || '—'}</td>
            <td className="px-4 py-2">
              <select
                value={task.status}
                disabled={isPending}
                onChange={(e) =>
                  handleStatusChange(task.id, e.target.value as 'pending' | 'in_progress' | 'done')
                }
                className="rounded-md border border-rule px-2 py-1 text-xs"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </select>
            </td>
          </tr>
        ))}
        {tasks.length === 0 && (
          <tr>
            <td colSpan={5} className="px-4 py-6 text-center text-ink-soft/60">
              No open tasks. Nice work.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}