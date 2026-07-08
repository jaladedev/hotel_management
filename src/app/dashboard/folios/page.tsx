import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function FoliosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const statusFilter = params.status === 'closed' ? 'closed' : 'open'

  const { data: folios } = await supabase
    .from('folios')
    .select(
      '*, reservations(id, check_in, check_out, guests(first_name, last_name), room_types(name))'
    )
    .eq('status', statusFilter)
    .order('created_at', { ascending: false })

  const folioIds = (folios || []).map((f) => f.id)
  const { data: balances } = await supabase
    .from('folio_balances')
    .select('*')
    .in('folio_id', folioIds.length > 0 ? folioIds : ['00000000-0000-0000-0000-000000000000'])

  const balanceByFolioId = new Map((balances || []).map((b) => [b.folio_id, b.balance ?? 0]))

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-xl font-medium text-ink">Folios</h1>
        <div className="flex gap-2 text-sm">
          <Link
            href="/dashboard/folios?status=open"
            className={`rounded-md px-3 py-1.5 font-medium ${
              statusFilter === 'open' ? 'bg-indigo-700 text-paper' : 'bg-paper-dim text-ink-soft'
            }`}
          >
            Open
          </Link>
          <Link
            href="/dashboard/folios?status=closed"
            className={`rounded-md px-3 py-1.5 font-medium ${
              statusFilter === 'closed' ? 'bg-indigo-700 text-paper' : 'bg-paper-dim text-ink-soft'
            }`}
          >
            Closed
          </Link>
        </div>
      </div>

      <table className="w-full overflow-hidden rounded-lg border border-rule bg-white text-sm">
        <thead className="bg-paper-dim text-left text-xs font-medium uppercase text-ink-soft">
          <tr>
            <th className="px-4 py-2">Guest</th>
            <th className="px-4 py-2">Room Type</th>
            <th className="px-4 py-2">Stay</th>
            <th className="px-4 py-2">Balance</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule/60">
          {(folios || []).map((f) => {
            const balance = balanceByFolioId.get(f.id) ?? 0
            return (
              <tr key={f.id}>
                <td className="px-4 py-2 font-medium text-ink">
                  {f.reservations?.guests
                    ? `${f.reservations.guests.first_name} ${f.reservations.guests.last_name}`
                    : '—'}
                </td>
                <td className="px-4 py-2 text-ink-soft">{f.reservations?.room_types?.name || '—'}</td>
                <td className="px-4 py-2 font-mono text-xs text-ink-soft">
                  {f.reservations?.check_in} → {f.reservations?.check_out}
                </td>
                <td
                  className={`px-4 py-2 font-mono ${
                    balance > 0 ? 'text-status-bad' : 'text-status-good'
                  }`}
                >
                  {balance.toLocaleString()}
                </td>
                <td className="px-4 py-2">
                  {f.reservations && (
                    <Link
                      href={`/dashboard/folios/${f.reservations.id}`}
                      className="text-xs font-medium text-indigo-700 hover:text-indigo-800"
                    >
                      View
                    </Link>
                  )}
                </td>
              </tr>
            )
          })}
          {(folios || []).length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-ink-soft/60">
                No {statusFilter} folios.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}