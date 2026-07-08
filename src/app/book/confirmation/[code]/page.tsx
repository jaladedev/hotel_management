import Link from 'next/link'
import { notFound } from 'next/navigation'
import { publicLookupReservation } from '@/app/actions/public-booking'
import { getHotelSettings } from '@/app/actions/hotel-settings'

export default async function BookingConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>
  searchParams: Promise<{ email?: string }>
}) {
  const { code } = await params
  const { email } = await searchParams

  if (!email) notFound()

  const [result, settings] = await Promise.all([
    publicLookupReservation(code, email),
    getHotelSettings(),
  ])
  if (result.error || !result.reservation) notFound()

  const r = result.reservation

  return (
    <div className="min-h-screen bg-paper px-6 py-10">
      <div className="mx-auto max-w-md text-center">
        <p className="mb-1 font-display text-sm font-medium text-ink-soft">{settings.name}</p>
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-status-good">
          Confirmed
        </p>
        <h1 className="font-display text-2xl font-medium text-ink">Booking Confirmed</h1>
        <p className="mt-2 text-sm text-ink-soft">
          A confirmation has been sent to {r.guests?.email}.
        </p>

        <div className="mt-6 rounded-lg border border-rule bg-white p-5 text-left text-sm">
          <p className="mb-1">
            <span className="font-medium text-ink-soft">Room:</span>{' '}
            <span className="text-ink">{r.room_types?.name}</span>
          </p>
          <p className="mb-1">
            <span className="font-medium text-ink-soft">Check-in:</span>{' '}
            <span className="font-mono text-ink">{r.check_in}</span>
          </p>
          <p className="mb-1">
            <span className="font-medium text-ink-soft">Check-out:</span>{' '}
            <span className="font-mono text-ink">{r.check_out}</span>
          </p>
          <p className="mb-4">
            <span className="font-medium text-ink-soft">Total:</span>{' '}
            <span className="font-mono text-ink">{r.total_amount.toLocaleString()}</span>
          </p>

          <p className="mb-2 text-xs text-ink-soft">
            Booking reference — keep this to manage your booking:
          </p>
          <span className="ledger-stamp">{r.confirmation_code}</span>
        </div>

        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-paper hover:bg-indigo-800"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}