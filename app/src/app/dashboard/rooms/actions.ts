'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaff } from '@/lib/get-current-staff'
import type { Enums } from '@/lib/database.types'

// ---------- Room Types ----------

export async function createRoomType(formData: FormData) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin') {
    return { error: 'Only admins can manage room types.' }
  }

  const supabase = await createClient()

  const amenitiesRaw = String(formData.get('amenities') || '')
  const amenities = amenitiesRaw
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean)

  const { error } = await supabase.from('room_types').insert({
    name: String(formData.get('name')),
    base_rate: Number(formData.get('base_rate')),
    max_occupancy: Number(formData.get('max_occupancy')),
    amenities,
    description: String(formData.get('description') || '') || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/rooms')
  return { success: true }
}

export async function updateRoomType(id: string, formData: FormData) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin') {
    return { error: 'Only admins can manage room types.' }
  }

  const supabase = await createClient()

  const amenitiesRaw = String(formData.get('amenities') || '')
  const amenities = amenitiesRaw
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean)

  const { error } = await supabase
    .from('room_types')
    .update({
      name: String(formData.get('name')),
      base_rate: Number(formData.get('base_rate')),
      max_occupancy: Number(formData.get('max_occupancy')),
      amenities,
      description: String(formData.get('description') || '') || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/rooms')
  return { success: true }
}

export async function toggleRoomTypeActive(id: string, isActive: boolean) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin') {
    return { error: 'Only admins can manage room types.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('room_types')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/rooms')
  return { success: true }
}

// ---------- Rooms ----------

export async function createRoom(formData: FormData) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin' && staff.role !== 'front_desk') {
    return { error: 'You do not have permission to manage rooms.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.from('rooms').insert({
    room_number: String(formData.get('room_number')),
    floor: String(formData.get('floor') || '') || null,
    room_type_id: String(formData.get('room_type_id')),
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/rooms')
  return { success: true }
}

export async function updateRoom(id: string, formData: FormData) {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin' && staff.role !== 'front_desk') {
    return { error: 'You do not have permission to manage rooms.' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('rooms')
    .update({
      room_number: String(formData.get('room_number')),
      floor: String(formData.get('floor') || '') || null,
      room_type_id: String(formData.get('room_type_id')),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/rooms')
  revalidatePath('/dashboard/rooms/board')
  return { success: true }
}

export async function updateRoomStatus(
  id: string,
  status: Enums<'room_status'>,
  outOfOrderReason?: string
) {
  const staff = await getCurrentStaff()
  if (!['admin', 'front_desk', 'housekeeping'].includes(staff.role)) {
    return { error: 'You do not have permission to update room status.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('rooms')
    .update({
      status,
      out_of_order_reason: status === 'out_of_order' ? outOfOrderReason || null : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/rooms')
  return { success: true }
}