import { useState } from 'react'

import { Download } from 'lucide-react'

import { LoadingSpinner } from '#/components/ui/LoadingSpinner'
import type { CsvRow } from '#/lib/csv-export'
import { downloadCsv } from '#/lib/csv-export'

type CsvDownloadButtonProps = {
  filename: string
  /** Inline rows OR a server fetcher to load all rows on demand. */
  rows?: ReadonlyArray<CsvRow>
  fetchRows?: () => Promise<ReadonlyArray<CsvRow>>
  headers?: ReadonlyArray<string>
  label?: string
  className?: string
  disabled?: boolean
}

export function CsvDownloadButton({
  filename,
  rows,
  fetchRows,
  headers,
  label = 'CSV',
  className,
  disabled,
}: CsvDownloadButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setError(null)
    if (rows) {
      downloadCsv(filename, rows, headers)
      return
    }
    if (!fetchRows) return
    setLoading(true)
    try {
      const fetched = await fetchRows()
      downloadCsv(filename, fetched, headers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        className={['button-secondary inline-flex items-center gap-1.5', className]
          .filter(Boolean)
          .join(' ')}
        onClick={handleClick}
        disabled={disabled || loading}
      >
        {loading ? <LoadingSpinner size={13} /> : <Download size={13} />}
        {label}
      </button>
      {error && <p className="csv-error">{error}</p>}
    </div>
  )
}
