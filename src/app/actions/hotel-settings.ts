'use server'

import { createServiceClient } from '@/lib/supabase/service'

export async function getHotelSettings() {
  const supabase = createServiceClient()
  const { data, error } = await supabase.from('hotel_settings').select('*').single()

  if (error) {
    console.error('getHotelSettings failed:', error.message)
  }

  return (
    data || {
      id: true as const,
      name: 'The Golden Hotel',
      address: 'New Heaven, Lagos, Nigeria',
      phone: '+234 123 456 7890',
      email: 'info@thegoldenhotel.com',
      currency: 'NGN',
      cancellation_policy: 'Cancellation policy goes here.',
      updated_at: new Date().toISOString(),
    }
  )
}