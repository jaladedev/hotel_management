import Link from 'next/link'
import { getActiveRoomTypes } from '@/app/actions/public-booking'

export default async function HomePage() {
  const roomTypes = await getActiveRoomTypes()

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-rule bg-paper px-6 py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="font-display text-lg font-medium tracking-tight text-ink">Our Hotel</h1>
          <Link
            href="/my-booking"
            className="text-sm font-medium text-ink-soft hover:text-indigo-700"
          >
            Manage my booking
          </Link>
        </div>
      </header>

      <section className="pattern-adire relative overflow-hidden bg-indigo-900 px-6 py-20 text-paper">
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-brass-400">
            Direct booking · Best rate guaranteed
          </p>
          <h2 className="font-display text-4xl font-medium leading-tight sm:text-5xl">
            A quiet stay, thoughtfully kept
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-indigo-100">
            Book directly with us — no middlemen, no markup. Check availability and confirm your
            room in a few minutes.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="mb-1 font-display text-2xl font-medium text-ink">Rooms</h2>
        <p className="mb-8 text-sm text-ink-soft">
          Select a room type to check availability and book directly.
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {roomTypes.map((rt) => (
            <div
              key={rt.id}
              className="flex flex-col rounded-lg border border-rule bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="font-display text-lg font-medium text-ink">{rt.name}</h3>
              {rt.description && (
                <p className="mt-1 text-sm text-ink-soft">{rt.description}</p>
              )}
              <p className="mt-2 font-mono text-xs text-ink-soft">
                Sleeps up to {rt.max_occupancy}
              </p>
              {rt.amenities && rt.amenities.length > 0 && (
                <p className="mt-1 text-xs text-ink-soft/70">{rt.amenities.join(' · ')}</p>
              )}
              <div className="mt-4 border-t border-rule pt-4">
                <p className="font-display text-xl font-medium text-ink">
                  {rt.base_rate.toLocaleString()}
                  <span className="ml-1 font-sans text-xs font-normal text-ink-soft">
                    / night from
                  </span>
                </p>
              </div>
              <Link
                href={`/book?room_type_id=${rt.id}`}
                className="mt-4 rounded-md bg-indigo-700 px-4 py-2 text-center text-sm font-medium text-paper hover:bg-indigo-800"
              >
                Check availability
              </Link>
            </div>
          ))}
          {roomTypes.length === 0 && (
            <p className="text-ink-soft">No rooms currently listed.</p>
          )}
        </div>
      </main>
    </div>
  )
}