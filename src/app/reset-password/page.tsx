'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  return (
    <div className="pattern-adire flex min-h-screen items-center justify-center bg-indigo-900 px-4">
      <div className="w-full max-w-sm rounded-lg border border-indigo-600 bg-paper p-8 shadow-lg">
        <p className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-brass-600">
          Staff Access
        </p>
        <h1 className="mb-6 font-display text-xl font-medium text-ink">Set a new password</h1>

        {success ? (
          <p className="text-sm text-status-good">Password updated. Redirecting...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-soft">
                New password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-rule px-3 py-2 text-sm text-ink focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-soft">
                Confirm password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-md border border-rule px-3 py-2 text-sm text-ink focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoComplete="new-password"
              />
            </div>

            {error && <p className="text-sm text-status-bad">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-paper hover:bg-indigo-800 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}