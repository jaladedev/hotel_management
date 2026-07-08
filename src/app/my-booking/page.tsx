import Link from 'next/link'
import { getHotelSettings } from '@/app/actions/hotel-settings'
import { ManageBookingForm } from '@/components/public/manage-booking-form'

export default async function MyBookingPage() {
  const settings = await getHotelSettings()

  return (
    <div className="min-h-screen bg-paper px-6 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-ink-soft hover:text-indigo-700">
            ← Back to rooms
          </Link>
          <span className="font-display text-sm font-medium text-ink">{settings.name}</span>
        </div>
        <h1 className="mb-1 font-display text-2xl font-medium text-ink">Manage My Booking</h1>
        <p className="mb-6 text-sm text-ink-soft">
          Enter your booking reference and the email you used to book.
        </p>
        <ManageBookingForm />
      </div>
    </div>
  )
}