import { headers } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'

// Best-effort client IP extraction. Works behind Vercel/most reverse
// proxies (which set x-forwarded-for); falls back to a constant if
// running somewhere that doesn't set it (e.g. some local setups) —
// in that fallback case rate limiting degrades to "shared across all
// visitors" rather than per-IP, which is still better than nothing.
async function getClientIp(): Promise<string> {
  const headersList = await headers()
  const forwardedFor = headersList.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0].trim()
  const realIp = headersList.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}

/**
 * Returns { allowed: true } if the action is under its rate limit, or
 * { allowed: false, error } if the caller should be blocked. Records
 * this attempt toward the count as a side effect when allowed — callers
 * don't need a separate "record" step.
 */
export async function checkRateLimit(
  action: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<{ allowed: boolean; error?: string }> {
  const ip = await getClientIp()
  const key = `${action}:${ip}`
  const supabase = createServiceClient()

  const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString()

  const { count, error: countError } = await supabase
    .from('rate_limit_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('key', key)
    .gte('created_at', windowStart)

  if (countError) {
    // Fail open — a rate-limit infrastructure hiccup shouldn't block
    // legitimate bookings. Logged for visibility.
    console.error('Rate limit check failed:', countError.message)
    return { allowed: true }
  }

  if ((count ?? 0) >= maxAttempts) {
    return {
      allowed: false,
      error: 'Too many attempts. Please wait a while before trying again.',
    }
  }

  await supabase.from('rate_limit_attempts').insert({ key })

  // Opportunistic cleanup — no cron needed at this scale. Deletes rows
  // older than a day, roughly 1-in-20 calls, to keep the table small
  // without adding overhead to every single request.
  if (Math.random() < 0.05) {
    const dayAgo = new Date(Date.now() - 86400000).toISOString()
    await supabase.from('rate_limit_attempts').delete().lt('created_at', dayAgo)
  }

  return { allowed: true }
}