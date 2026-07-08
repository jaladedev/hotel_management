import Link from 'next/link'
import { getActiveRoomTypes } from '@/app/actions/public-booking'
import { getHotelSettings } from '@/app/actions/hotel-settings'
import { HomeSearchWidget } from '@/components/public/home-search-widget'

const FEATURES = [
  { title: 'Best Rate Guaranteed', desc: 'Book direct and always get our lowest price — no third-party markup.' },
  { title: '24/7 Front Desk', desc: 'Our team is on hand around the clock for anything you need.' },
  { title: 'Flexible Payment', desc: 'Pay by card via Paystack or settle in cash at check-in.' },
  { title: 'Free Wi-Fi', desc: 'Fast, complimentary internet throughout the property.' },
]

// Placeholder "photography" — a tinted gradient standing in for real room
// images until actual photography is supplied. Swap the room-card <div>
// below for an <img> once photos exist (room_types.photos is already
// wired in the schema for this).
const PLACEHOLDER_GRADIENTS = [
  'from-indigo-800 to-indigo-600',
  'from-brass-700 to-brass-500',
  'from-indigo-900 to-indigo-700',
  'from-status-good to-indigo-700',
]

export default async function HomePage() {
  const [roomTypes, settings] = await Promise.all([getActiveRoomTypes(), getHotelSettings()])

  return (
    <div className="min-h-screen bg-paper">
      {/* Sticky nav */}
      <header className="sticky top-0 z-20 border-b border-rule bg-paper/95 backdrop-blur px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="font-display text-lg font-medium tracking-tight text-ink">
            {settings.name}
          </span>
          <nav className="flex items-center gap-6">
            <a href="#rooms" className="text-sm font-medium text-ink-soft hover:text-indigo-700">
              Rooms
            </a>
            <Link
              href="/my-booking"
              className="text-sm font-medium text-ink-soft hover:text-indigo-700"
            >
              Manage my booking
            </Link>
            <Link
              href="/book"
              className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-paper hover:bg-indigo-800"
            >
              Book Now
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pattern-adire relative overflow-hidden bg-indigo-900 px-6 pb-24 pt-20 text-paper">
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-brass-400">
            Direct booking · Best rate guaranteed
          </p>
          <h1 className="font-display text-4xl font-medium leading-tight sm:text-5xl">
            A quiet stay, thoughtfully kept
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-indigo-100">
            Book directly with us — no middlemen, no markup. Check availability and confirm your
            room in a few minutes.
          </p>
        </div>
      </section>

      {/* Search widget, overlapping the hero/content boundary */}
      <div className="px-6">
        <HomeSearchWidget roomTypes={roomTypes} />
      </div>

      {/* Welcome */}
      <section className="mx-auto max-w-3xl px-6 pb-16 pt-20 text-center">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-brass-600">Welcome</p>
        <h2 className="mb-4 font-display text-2xl font-medium text-ink">
          A place to slow down
        </h2>
        <p className="text-sm leading-relaxed text-ink-soft">
          Every room is kept simple and unfussy, so the details that matter — a good night&apos;s
          rest, a warm welcome, a quiet place to work — are never an afterthought.
          {settings.address && ` We're located at ${settings.address}.`}
        </p>
      </section>

      {/* Rooms */}
      <main id="rooms" className="mx-auto max-w-6xl px-6 pb-20">
        <div className="mb-8 text-center">
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-brass-600">
            Accommodation
          </p>
          <h2 className="font-display text-2xl font-medium text-ink">Rooms &amp; Suites</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {roomTypes.map((rt, i) => (
            <div
              key={rt.id}
              className="flex flex-col overflow-hidden rounded-lg border border-rule bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div
                className={`h-40 bg-gradient-to-br ${PLACEHOLDER_GRADIENTS[i % PLACEHOLDER_GRADIENTS.length]}`}
              />
              <div className="flex flex-1 flex-col p-5">
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
                <div className="mt-4 flex-1 border-t border-rule pt-4">
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
            </div>
          ))}
          {roomTypes.length === 0 && (
            <p className="col-span-full text-center text-ink-soft">
              No rooms currently listed.
            </p>
          )}
        </div>
      </main>

      {/* Features strip */}
      <section className="border-y border-rule bg-white px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="text-center">
              <div className="mx-auto mb-3 h-8 w-8 rounded-full border-2 border-brass-500" />
              <h3 className="mb-1 text-sm font-semibold text-ink">{f.title}</h3>
              <p className="text-xs leading-relaxed text-ink-soft">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-indigo-900 px-6 py-12 text-indigo-100">
        <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-3">
          <div>
            <p className="mb-2 font-display text-lg font-medium text-paper">{settings.name}</p>
            {settings.address && <p className="text-sm">{settings.address}</p>}
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brass-400">
              Contact
            </p>
            {settings.phone && <p className="text-sm">{settings.phone}</p>}
            {settings.email && <p className="text-sm">{settings.email}</p>}
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brass-400">
              Booking
            </p>
            <Link href="/book" className="block text-sm hover:text-paper">
              Book a room
            </Link>
            <Link href="/my-booking" className="block text-sm hover:text-paper">
              Manage my booking
            </Link>
          </div>
        </div>
        <p className="mx-auto mt-10 max-w-6xl border-t border-indigo-700 pt-6 text-xs text-indigo-300">
          © {new Date().getFullYear()} {settings.name}. All rights reserved.
        </p>
      </footer>
    </div>
  )
}