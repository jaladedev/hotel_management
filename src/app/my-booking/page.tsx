import Link from 'next/link'
import { ManageBookingForm } from '@/components/public/manage-booking-form'

export default function MyBookingPage() {
  return (
    <div className="min-h-screen bg-paper px-6 py-10">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-sm font-medium text-ink-soft hover:text-indigo-700">
          ← Back to rooms
        </Link>
        <h1 className="mb-1 mt-4 font-display text-2xl font-medium text-ink">
          Manage My Booking
        </h1>
        <p className="mb-6 text-sm text-ink-soft">
          Enter your booking reference and the email you used to book.
        </p>
        <ManageBookingForm />
      </div>
    </div>
  )
}