'use client'

import { useState, useTransition } from 'react'
import { refundCashPayment, refundPaystackPayment } from '@/app/dashboard/folios/actions'
import type { Tables } from '@/lib/database.types'

export function RefundsPanel({
  folioId,
  paystackPayments,
  refunds,
}: {
  folioId: string
  paystackPayments: Tables<'payments'>[]
  refunds: Tables<'refunds'>[]
}) {
  const [isPending, startTransition] = useTransition()
  const [cashOpen, setCashOpen] = useState(false)
  const [paystackRefundPaymentId, setPaystackRefundPaymentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleCashRefund(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await refundCashPayment(folioId, formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      setCashOpen(false)
    })
  }

  function handlePaystackRefund(paymentId: string, formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await refundPaystackPayment(paymentId, formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      setPaystackRefundPaymentId(null)
    })
  }

  return (
    <div className="rounded-lg border border-rule bg-white p-4">
      <h3 className="mb-2 text-sm font-semibold text-ink">Refunds</h3>

      <div className="mb-3 flex flex-wrap gap-2">
        {!cashOpen && (
          <button
            onClick={() => setCashOpen(true)}
            className="rounded-md bg-paper-dim px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-rule/50"
          >
            Refund cash
          </button>
        )}
        {paystackPayments.map((p) => (
          <button
            key={p.id}
            onClick={() => setPaystackRefundPaymentId(p.id)}
            className="rounded-md bg-paper-dim px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-rule/50"
          >
            Refund Paystack payment ({p.amount.toLocaleString()})
          </button>
        ))}
      </div>

      {cashOpen && (
        <form action={handleCashRefund} className="mb-3 flex items-end gap-2 rounded-md bg-paper-dim p-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">Amount</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              required
              autoFocus
              className="w-32 rounded-md border border-rule px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">Reason</label>
            <input
              name="reason"
              className="w-48 rounded-md border border-rule px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-indigo-700 px-3 py-1.5 text-xs font-medium text-paper hover:bg-indigo-800 disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Confirm'}
          </button>
          <button
            type="button"
            onClick={() => setCashOpen(false)}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-paper-dim"
          >
            Cancel
          </button>
        </form>
      )}

      {paystackRefundPaymentId && (
        <form
          action={(formData) => handlePaystackRefund(paystackRefundPaymentId, formData)}
          className="mb-3 flex items-end gap-2 rounded-md bg-paper-dim p-3"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">Amount</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              required
              autoFocus
              className="w-32 rounded-md border border-rule px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">Reason</label>
            <input
              name="reason"
              className="w-48 rounded-md border border-rule px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-indigo-700 px-3 py-1.5 text-xs font-medium text-paper hover:bg-indigo-800 disabled:opacity-50"
          >
            {isPending ? 'Submitting...' : 'Initiate refund'}
          </button>
          <button
            type="button"
            onClick={() => setPaystackRefundPaymentId(null)}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-paper-dim"
          >
            Cancel
          </button>
        </form>
      )}

      {error && <p className="mb-2 text-xs text-status-bad">{error}</p>}

      {refunds.length > 0 && (
        <table className="w-full text-xs">
          <thead className="text-left text-ink-soft">
            <tr>
              <th className="py-1">Date</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule/60">
            {refunds.map((r) => (
              <tr key={r.id}>
                <td className="py-1 text-ink-soft">
                  {new Date(r.created_at).toLocaleDateString()}
                </td>
                <td className="capitalize text-ink-soft">{r.method}</td>
                <td className="text-ink-soft">{r.amount.toLocaleString()}</td>
                <td className="capitalize text-ink-soft">{r.status}</td>
                <td className="text-ink-soft">{r.reason || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}