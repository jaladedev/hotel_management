'use client'

import { useState } from 'react'

export function DataExportPanel() {
  const today = new Date().toISOString().slice(0, 10)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

  const [start, setStart] = useState(thirtyDaysAgo)
  const [end, setEnd] = useState(today)

  return (
    <div className="max-w-lg space-y-4 rounded-lg border border-rule bg-white p-4">
      <div>
        <p className="mb-2 text-sm font-medium text-ink">Guest data</p>
        <a
          href="/api/export/guests"
          className="inline-block rounded-md bg-paper-dim px-4 py-1.5 text-xs font-medium text-ink-soft hover:bg-rule/50"
        >
          Download all guests (CSV)
        </a>
      </div>

      <div className="border-t border-rule pt-4">
        <p className="mb-2 text-sm font-medium text-ink">Financial data</p>
        <div className="mb-2 flex items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">From</label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="rounded-md border border-rule px-2 py-1 text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">To</label>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="rounded-md border border-rule px-2 py-1 text-xs"
            />
          </div>
        </div>
        <a
          href={`/api/export/financial?start=${start}&end=${end}`}
          className="inline-block rounded-md bg-paper-dim px-4 py-1.5 text-xs font-medium text-ink-soft hover:bg-rule/50"
        >
          Download payments (CSV)
        </a>
      </div>
    </div>
  )
}