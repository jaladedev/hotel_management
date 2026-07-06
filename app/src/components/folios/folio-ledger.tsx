import { LineItemTypeBadge } from '@/components/folios/line-item-type-badge'
import type { Tables } from '@/lib/database.types'

export function FolioLedger({
  lineItems,
  balance,
}: {
  lineItems: Tables<'folio_line_items'>[]
  balance: number
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-rule bg-white">
      <table className="w-full text-sm">
        <thead className="bg-paper-dim text-left text-xs font-medium uppercase text-ink-soft">
          <tr>
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2">Type</th>
            <th className="px-4 py-2">Description</th>
            <th className="px-4 py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule/60">
          {lineItems.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-2 text-ink-soft">
                {new Date(item.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-2">
                <LineItemTypeBadge type={item.type} />
              </td>
              <td className="px-4 py-2 text-ink-soft">{item.description}</td>
              <td
                className={`px-4 py-2 text-right font-medium ${
                  item.amount < 0 ? 'text-status-good' : 'text-ink'
                }`}
              >
                {item.amount < 0 ? '-' : ''}
                {Math.abs(item.amount).toLocaleString()}
              </td>
            </tr>
          ))}
          {lineItems.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-ink-soft/60">
                No charges yet.
              </td>
            </tr>
          )}
        </tbody>
        <tfoot className="border-t border-rule bg-paper-dim">
          <tr>
            <td colSpan={3} className="px-4 py-3 text-right text-sm font-semibold text-ink">
              Balance due
            </td>
            <td
              className={`px-4 py-3 text-right text-sm font-semibold ${
                balance > 0 ? 'text-status-bad' : 'text-status-good'
              }`}
            >
              {balance.toLocaleString()}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}