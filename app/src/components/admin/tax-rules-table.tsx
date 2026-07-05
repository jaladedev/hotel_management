'use client'

import { useTransition } from 'react'
import { toggleTaxRuleActive } from '@/app/dashboard/admin/rates/actions'
import type { Tables } from '@/lib/database.types'

export function TaxRulesTable({ taxRules }: { taxRules: Tables<'tax_rules'>[] }) {
  const [isPending, startTransition] = useTransition()

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      await toggleTaxRuleActive(id, !current)
    })
  }

  return (
    <table className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-sm">
      <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
        <tr>
          <th className="px-4 py-2">Name</th>
          <th className="px-4 py-2">Rate</th>
          <th className="px-4 py-2">Type</th>
          <th className="px-4 py-2">Active</th>
          <th className="px-4 py-2"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {taxRules.map((tax) => (
          <tr key={tax.id}>
            <td className="px-4 py-2 font-medium text-gray-900">{tax.name}</td>
            <td className="px-4 py-2 text-gray-600">{tax.rate_percent}%</td>
            <td className="px-4 py-2 text-gray-600">
              {tax.is_inclusive ? 'Inclusive' : 'Exclusive (added at booking)'}
            </td>
            <td className="px-4 py-2">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  tax.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {tax.is_active ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td className="px-4 py-2">
              <button
                disabled={isPending}
                onClick={() => handleToggle(tax.id, tax.is_active)}
                className="text-xs font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
              >
                {tax.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </td>
          </tr>
        ))}
        {taxRules.length === 0 && (
          <tr>
            <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
              No tax rules configured.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}