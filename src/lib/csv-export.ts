export type CsvRow = Record<string, string | number | null | undefined>

function escapeCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/** Build CSV text from an array of objects. The first row's keys define columns. */
export function buildCsv(rows: ReadonlyArray<CsvRow>, headers?: ReadonlyArray<string>): string {
  if (!rows.length) return headers?.join(',') ?? ''
  const cols = headers ?? Object.keys(rows[0])
  const lines = [
    cols.join(','),
    ...rows.map((row) => cols.map((c) => escapeCell(row[c])).join(',')),
  ]
  return lines.join('\n')
}

/** Trigger a browser CSV download. Safe no-op when called server-side. */
export function downloadCsv(
  filename: string,
  rows: ReadonlyArray<CsvRow>,
  headers?: ReadonlyArray<string>,
): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  if (!rows.length) return

  const csv = buildCsv(rows, headers)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Build a filename like `bookings-2026-05-22.csv`. */
export function csvFilename(prefix: string, suffix?: string): string {
  const stamp = new Date().toISOString().split('T')[0]
  const trail = suffix ? `-${suffix}` : ''
  return `${prefix}-${stamp}${trail}.csv`
}
