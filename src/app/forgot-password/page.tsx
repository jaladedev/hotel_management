'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getHotelSettings } from '@/app/actions/hotel-settings'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [hotelName, setHotelName] = useState('')

  useEffect(() => {
    getHotelSettings().then((s) => setHotelName(s.name))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    setLoading(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setSent(true)
  }

  return (
    <div className="pattern-adire flex min-h-screen items-center justify-center bg-indigo-900 px-4">
      <div className="w-full max-w-sm rounded-lg border border-indigo-600 bg-paper p-8 shadow-lg">
        <p className="mb-1 font-display text-sm font-medium text-ink">{hotelName}</p>
        <p className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-brass-600">
          Staff Access
        </p>
        <h1 className="mb-2 font-display text-xl font-medium text-ink">Reset password</h1>
        <p className="mb-6 text-sm text-ink-soft">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        {sent ? (
          <p className="text-sm text-status-good">
            Check your inbox for a password reset link.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink-soft">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-rule px-3 py-2 text-sm text-ink focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoComplete="email"
              />
            </div>

            {error && <p className="text-sm text-status-bad">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-paper hover:bg-indigo-800 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}

        <Link
          href="/login"
          className="mt-4 block text-center text-xs font-medium text-ink-soft hover:text-indigo-700"
        >
          Back to login
        </Link>
      </div>
    </div>
  )
}