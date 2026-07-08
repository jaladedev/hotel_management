import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function GuestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  let query = supabase
    .from('guests')
    .select('*')
    .order('created_at', { ascending: false })

  if (params.q) {
    query = query.or(
      `first_name.ilike.%${params.q}%,last_name.ilike.%${params.q}%,email.ilike.%${params.q}%,phone.ilike.%${params.q}%`
    )
  }

  const { data: guests } = await query

  return (
    <div>
      <h1 className="mb-4 text-xl font-display font-medium text-ink">Guests</h1>

      <form className="mb-4 flex gap-3" method="get">
        <input
          name="q"
          placeholder="Search by name, email, or phone..."
          defaultValue={params.q || ''}
          className="w-72 rounded-md border border-rule px-3 py-1.5 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-paper-dim px-4 py-1.5 text-sm font-medium text-ink-soft hover:bg-rule/50"
        >
          Search
        </button>
      </form>

      <table className="w-full overflow-hidden rounded-lg border border-rule bg-white text-sm">
        <thead className="bg-paper-dim text-left text-xs font-medium uppercase text-ink-soft">
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Email</th>
            <th className="px-4 py-2">Phone</th>
            <th className="px-4 py-2">Repeat</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule/60">
          {(guests || []).map((g) => (
            <tr key={g.id}>
              <td className="px-4 py-2 font-medium text-ink">
                {g.first_name} {g.last_name}
              </td>
              <td className="px-4 py-2 text-ink-soft">{g.email || '—'}</td>
              <td className="px-4 py-2 text-ink-soft">{g.phone || '—'}</td>
              <td className="px-4 py-2">
                {g.is_repeat_guest && (
                  <span className="inline-block rounded-full bg-brass-100 px-2 py-0.5 text-xs font-medium text-brass-700">
                    Repeat
                  </span>
                )}
              </td>
              <td className="px-4 py-2">
                <Link
                  href={`/dashboard/guests/${g.id}`}
                  className="text-xs font-medium text-indigo-700 hover:text-indigo-800"
                >
                  View profile
                </Link>
              </td>
            </tr>
          ))}
          {(guests || []).length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-ink-soft/60">
                No guests found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}