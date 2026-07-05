import Link from 'next/link'
import { notFound } from 'next/navigation'
import { publicLookupReservation } from '@/app/actions/public-booking'

export default async function BookingConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ reservationId: string }>
  searchParams: Promise<{ email?: string }>
}) {
  const { reservationId } = await params
  const { email } = await searchParams

  if (!email) notFound()

  const result = await publicLookupReservation(reservationId, email)
  if (result.error || !result.reservation) notFound()

  const r = result.reservation

  return (
    <div className="min-h-screen bg-white px-6 py-10">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-2xl font-semibold text-green-700">Booking Confirmed</h1>
        <p className="mt-2 text-sm text-gray-600">
          A confirmation has been sent to {r.guests?.email}.
        </p>

        <div className="mt-6 rounded-lg border border-gray-200 p-5 text-left text-sm">
          <p className="mb-1">
            <span className="font-medium text-gray-700">Room:</span> {r.room_types?.name}
          </p>
          <p className="mb-1">
            <span className="font-medium text-gray-700">Check-in:</span> {r.check_in}
          </p>
          <p className="mb-1">
            <span className="font-medium text-gray-700">Check-out:</span> {r.check_out}
          </p>
          <p className="mb-1">
            <span className="font-medium text-gray-700">Total:</span>{' '}
            {r.total_amount.toLocaleString()}
          </p>
          <p className="mt-3 text-xs text-gray-500">
            Booking reference (keep this to manage your booking):
            <br />
            <span className="break-all font-mono text-gray-700">{r.id}</span>
          </p>
        </div>

        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}