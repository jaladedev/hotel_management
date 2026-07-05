import Link from 'next/link'
import { getActiveRoomTypes } from '@/app/actions/public-booking'

export default async function HomePage() {
  const roomTypes = await getActiveRoomTypes()

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-6 py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Our Hotel</h1>
          <Link
            href="/my-booking"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Manage my booking
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <h2 className="mb-2 text-2xl font-semibold text-gray-900">Rooms</h2>
        <p className="mb-8 text-sm text-gray-600">
          Select a room type to check availability and book directly.
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {roomTypes.map((rt) => (
            <div
              key={rt.id}
              className="flex flex-col rounded-lg border border-gray-200 p-5 shadow-sm"
            >
              <h3 className="text-base font-semibold text-gray-900">{rt.name}</h3>
              {rt.description && (
                <p className="mt-1 text-sm text-gray-600">{rt.description}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">Sleeps up to {rt.max_occupancy}</p>
              {rt.amenities && rt.amenities.length > 0 && (
                <p className="mt-1 text-xs text-gray-400">{rt.amenities.join(' · ')}</p>
              )}
              <p className="mt-4 text-lg font-semibold text-gray-900">
                {rt.base_rate.toLocaleString()}
                <span className="text-xs font-normal text-gray-500"> / night from</span>
              </p>
              <Link
                href={`/book?room_type_id=${rt.id}`}
                className="mt-4 rounded-md bg-gray-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-gray-800"
              >
                Check availability
              </Link>
            </div>
          ))}
          {roomTypes.length === 0 && (
            <p className="text-gray-400">No rooms currently listed.</p>
          )}
        </div>
      </main>
    </div>
  )
}