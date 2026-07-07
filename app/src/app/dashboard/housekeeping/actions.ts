'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaff } from '@/lib/get-current-staff'

// ---------- Tasks ----------

export async function createHousekeepingTask(formData: FormData) {
  const staff = await getCurrentStaff()
  if (!['admin', 'front_desk', 'housekeeping'].includes(staff.role)) {
    return { error: 'You do not have permission to create tasks.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('housekeeping_tasks').insert({
    room_id: String(formData.get('room_id')),
    task_type: String(formData.get('task_type')) as never,
    assigned_to: String(formData.get('assigned_to') || '') || null,
    notes: String(formData.get('notes') || '') || null,
    created_by: staff.id,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/housekeeping')
  return { success: true }
}

export async function updateTaskStatus(taskId: string, status: 'pending' | 'in_progress' | 'done') {
  const staff = await getCurrentStaff()
  if (!['admin', 'front_desk', 'housekeeping'].includes(staff.role)) {
    return { error: 'You do not have permission to update tasks.' }
  }

  const supabase = await createClient()

  const { data: task } = await supabase
    .from('housekeeping_tasks')
    .select('room_id, task_type')
    .eq('id', taskId)
    .single()

  const { error } = await supabase
    .from('housekeeping_tasks')
    .update({
      status,
      completed_at: status === 'done' ? new Date().toISOString() : null,
    })
    .eq('id', taskId)

  if (error) return { error: error.message }

  // Marking a cleaning/inspection task done reasonably implies the room is
  // now clean; a maintenance task done implies it's fixed and vacant again.
  // Front desk can always override manually from the room board either way.
  if (status === 'done' && task) {
    const newRoomStatus = task.task_type === 'maintenance' ? 'vacant' : 'clean'
    await supabase.from('rooms').update({ status: newRoomStatus }).eq('id', task.room_id)
  }

  revalidatePath('/dashboard/housekeeping')
  revalidatePath('/dashboard/rooms')
  revalidatePath('/dashboard/rooms/board')
  return { success: true }
}

// ---------- Lost & Found ----------

export async function createLostFoundItem(formData: FormData) {
  const staff = await getCurrentStaff()
  if (!['admin', 'front_desk', 'housekeeping'].includes(staff.role)) {
    return { error: 'You do not have permission to log lost & found items.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('lost_found_items').insert({
    room_id: String(formData.get('room_id') || '') || null,
    description: String(formData.get('description')),
    found_by: staff.id,
    notes: String(formData.get('notes') || '') || null,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/housekeeping/lost-found')
  return { success: true }
}

export async function updateLostFoundStatus(
  itemId: string,
  status: 'stored' | 'returned' | 'disposed',
  returnedTo?: string
) {
  const staff = await getCurrentStaff()
  if (!['admin', 'front_desk', 'housekeeping'].includes(staff.role)) {
    return { error: 'You do not have permission to update lost & found items.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('lost_found_items')
    .update({ status, returned_to: returnedTo || null })
    .eq('id', itemId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/housekeeping/lost-found')
  return { success: true }
}