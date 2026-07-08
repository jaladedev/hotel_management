'use client'

import { useTransition } from 'react'
import { toggleStaffActive, updateStaffRole } from '@/app/dashboard/admin/actions'
import type { Tables } from '@/lib/database.types'

export function StaffTable({
  staffList,
  currentStaffId,
}: {
  staffList: Tables<'staff'>[]
  currentStaffId: string
}) {
  const [isPending, startTransition] = useTransition()

  function handleRoleChange(staffId: string, role: string) {
    startTransition(async () => {
      await updateStaffRole(staffId, role)
    })
  }

  function handleToggleActive(staffId: string, current: boolean) {
    startTransition(async () => {
      await toggleStaffActive(staffId, !current)
    })
  }

  return (
    <table className="w-full overflow-hidden rounded-lg border border-rule bg-white text-sm">
      <thead className="bg-paper-dim text-left text-xs font-medium uppercase text-ink-soft">
        <tr>
          <th className="px-4 py-2">Name</th>
          <th className="px-4 py-2">Role</th>
          <th className="px-4 py-2">Status</th>
          <th className="px-4 py-2"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-rule/60">
        {staffList.map((s) => {
          const isSelf = s.id === currentStaffId
          return (
            <tr key={s.id}>
              <td className="px-4 py-2 font-medium text-ink">
                {s.full_name} {isSelf && <span className="text-xs text-ink-soft">(you)</span>}
              </td>
              <td className="px-4 py-2">
                <select
                  value={s.role}
                  disabled={isPending || isSelf}
                  onChange={(e) => handleRoleChange(s.id, e.target.value)}
                  className="rounded-md border border-rule px-2 py-1 text-xs capitalize disabled:opacity-50"
                >
                  <option value="admin">Admin</option>
                  <option value="front_desk">Front Desk</option>
                  <option value="housekeeping">Housekeeping</option>
                </select>
              </td>
              <td className="px-4 py-2">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    s.is_active ? 'bg-status-good-bg text-status-good' : 'bg-status-neutral-bg text-status-neutral'
                  }`}
                >
                  {s.is_active ? 'Active' : 'Deactivated'}
                </span>
              </td>
              <td className="px-4 py-2">
                {!isSelf && (
                  <button
                    disabled={isPending}
                    onClick={() => handleToggleActive(s.id, s.is_active)}
                    className="text-xs font-medium text-ink-soft hover:text-indigo-700 disabled:opacity-50"
                  >
                    {s.is_active ? 'Deactivate' : 'Reactivate'}
                  </button>
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}