export function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const escape = (value: unknown) => {
    if (value === null || value === undefined) return ''
    const str = String(value)
    // Quote any field containing a comma, quote, or newline; double up
    // internal quotes per RFC 4180.
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const header = columns.join(',')
  const body = rows.map((row) => columns.map((col) => escape(row[col])).join(',')).join('\n')

  return `${header}\n${body}`
}