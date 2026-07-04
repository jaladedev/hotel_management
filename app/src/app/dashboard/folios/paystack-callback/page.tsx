import Link from 'next/link'
import { settlePaystackPayment } from '@/lib/paystack'
import { createServiceClient } from '@/lib/supabase/service'

export default async function PaystackCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>
}) {
  const { reference } = await searchParams

  if (!reference) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-red-600">No payment reference provided.</p>
      </div>
    )
  }

  const result = await settlePaystackPayment(reference)

  // Look up the folio's reservation so we can link back to the right folio page
  const supabase = createServiceClient()
  const { data: payment } = await supabase
    .from('payments')
    .select('folio_id, folios(reservation_id)')
    .eq('paystack_reference', reference)
    .single()

  const reservationId = (payment as unknown as { folios: { reservation_id: string } | null } | null)
    ?.folios?.reservation_id

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      {result.error ? (
        <>
          <h1 className="text-lg font-semibold text-red-700">Payment could not be confirmed</h1>
          <p className="mt-2 text-sm text-gray-600">{result.error}</p>
        </>
      ) : (
        <>
          <h1 className="text-lg font-semibold text-green-700">Payment confirmed</h1>
          <p className="mt-2 text-sm text-gray-600">
            {result.alreadySettled
              ? 'This payment was already recorded.'
              : 'The folio has been updated.'}
          </p>
        </>
      )}

      {reservationId && (
        <Link
          href={`/dashboard/folios/${reservationId}`}
          className="mt-6 inline-block rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Back to folio
        </Link>
      )}
    </div>
  )
}