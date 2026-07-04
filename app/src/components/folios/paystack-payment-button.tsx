'use client'

import { useState } from 'react'

export function PaystackPaymentButton({
  folioId,
  defaultAmount,
}: {
  folioId: string
  defaultAmount: number
}) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(defaultAmount.toString())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay() {
    setError(null)
    const numericAmount = Number(amount)
    if (!numericAmount || numericAmount <= 0) {
      setError('Enter a valid amount.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folioId, amount: numericAmount }),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Could not start payment.')
        setLoading(false)
        return
      }

      window.location.href = data.authorization_url
    } catch {
      setError('Network error starting payment.')
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-blue-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800"
      >
        Pay via Paystack
      </button>
    )
  }

  return (
    <div className="flex items-end gap-2 rounded-md border border-gray-200 bg-white p-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Amount to charge</label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-36 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        onClick={handlePay}
        disabled={loading}
        className="rounded-md bg-blue-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800 disabled:opacity-50"
      >
        {loading ? 'Redirecting...' : 'Continue to Paystack'}
      </button>
      <button
        onClick={() => setOpen(false)}
        className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
      >
        Cancel
      </button>
    </div>
  )
}