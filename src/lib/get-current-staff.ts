import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getCurrentStaff() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: staff, error } = await supabase
    .from('staff')
    .select('id, full_name, role, is_active')
    .eq('id', user.id)
    .single()

  if (error || !staff || !staff.is_active) {
    redirect('/login')
  }

  return staff
}