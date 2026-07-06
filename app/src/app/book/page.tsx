import Link from 'next/link'
import { getActiveRoomTypes } from '@/app/actions/public-booking'
import { PublicBookingForm } from '@/components/public/public-booking-form'

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ room_type_id?: string }>
}) {
  const roomTypes = await getActiveRoomTypes()
  const params = await searchParams

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-rule px-6 py-5">
        <div className="mx-auto max-w-2xl">
          <Link href="/" className="text-sm font-medium text-ink-soft hover:text-indigo-700">
            ← Back to rooms
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="mb-1 font-display text-2xl font-medium text-ink">Book Your Stay</h1>
        <p className="mb-6 text-sm text-ink-soft">
          Pick your dates and we&apos;ll show live availability and pricing.
        </p>
        <PublicBookingForm roomTypes={roomTypes} preselectedRoomTypeId={params.room_type_id} />
      </main>
    </div>
  )
}