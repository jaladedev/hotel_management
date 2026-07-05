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
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-6 py-5">
        <div className="mx-auto max-w-2xl">
          <Link href="/" className="text-sm font-medium text-gray-500 hover:text-gray-700">
            ← Back to rooms
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="mb-6 text-2xl font-semibold text-gray-900">Book Your Stay</h1>
        <PublicBookingForm roomTypes={roomTypes} preselectedRoomTypeId={params.room_type_id} />
      </main>
    </div>
  )
}