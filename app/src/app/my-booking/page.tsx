import Link from 'next/link'
import { ManageBookingForm } from '@/components/public/manage-booking-form'

export default function MyBookingPage() {
  return (
    <div className="min-h-screen bg-white px-6 py-10">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-sm font-medium text-gray-500 hover:text-gray-700">
          ← Back to rooms
        </Link>
        <h1 className="mb-6 mt-4 text-2xl font-semibold text-gray-900">Manage My Booking</h1>
        <ManageBookingForm />
      </div>
    </div>
  )
}