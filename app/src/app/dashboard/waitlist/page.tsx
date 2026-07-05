import { createClient } from '@/lib/supabase/server'
import { WaitlistTable } from '@/components/waitlist/waitlist-table'
import { NewWaitlistEntryForm } from '@/components/waitlist/new-waitlist-entry-form'

export default async function WaitlistPage() {
  const supabase = await createClient()

  const [{ data: entries }, { data: roomTypes }] = await Promise.all([
    supabase
      .from('waitlist_entries')
      .select('*, guests(first_name, last_name, email, phone), room_types(name)')
      .order('created_at', { ascending: false }),
    supabase.from('room_types').select('*').eq('is_active', true).order('name'),
  ])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Waitlist</h1>
        <NewWaitlistEntryForm roomTypes={roomTypes || []} />
      </div>
      <p className="mb-4 text-xs text-gray-500">
        Entries move to &quot;notified&quot; automatically when a matching reservation is
        cancelled or marked no-show — that&apos;s a signal to call the guest, not an automatic
        email yet.
      </p>
      <WaitlistTable entries={entries || []} />
    </div>
  )
}