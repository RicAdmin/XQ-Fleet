import { useState, useCallback } from 'react'
import { ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Column<T> {
  key: string
  header: string
  sortable?: boolean
  headerClassName?: string
  cellClassName?: string | ((row: T) => string)
  render: (row: T) => React.ReactNode
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  getKey: (row: T) => string | number
  sortKey?: string
  sortDir?: 'asc' | 'desc'
  onSort?: (key: string) => void
  emptyState?: React.ReactNode
  onRowClick?: (row: T) => void
  className?: string
}

// ─── useSortState hook ────────────────────────────────────────────────────────

export function useSortState<K extends string>(
  defaultKey: K,
  defaultDir: 'asc' | 'desc' = 'asc',
) {
  const [sortKey, setSortKey] = useState<K>(defaultKey)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultDir)

  const handleSort = useCallback(
    (key: K) => {
      if (key === sortKey) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortKey(key)
        setSortDir('asc')
      }
    },
    [sortKey],
  )

  return { sortKey, sortDir, handleSort }
}

// ─── SortIcon ─────────────────────────────────────────────────────────────────

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return <ArrowUpDown size={11} className="ml-1 inline opacity-35" />
  return dir === 'asc' ? (
    <ChevronUp size={11} className="ml-1 inline" />
  ) : (
    <ChevronDown size={11} className="ml-1 inline" />
  )
}

// ─── DataTable ────────────────────────────────────────────────────────────────

export function DataTable<T>({
  columns,
  data,
  getKey,
  sortKey,
  sortDir = 'asc',
  onSort,
  emptyState,
  onRowClick,
  className,
}: DataTableProps<T>) {
  return (
    <table className={`ui-table cars-table ${className ?? ''}`}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              className={[
                'px-3 py-2',
                col.sortable ? 'sortable' : '',
                col.headerClassName ?? '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
            >
              {col.sortable ? (
                <span className="sort-indicator">
                  {col.header}
                  <SortIcon active={sortKey === col.key} dir={sortDir} />
                </span>
              ) : (
                col.header
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          emptyState ? (
            <tr>
              <td colSpan={columns.length} className="p-0">
                {emptyState}
              </td>
            </tr>
          ) : null
        ) : (
          data.map((row) => (
            <tr
              key={getKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={onRowClick ? { cursor: 'pointer' } : undefined}
            >
              {columns.map((col) => {
                const cellCls =
                  typeof col.cellClassName === 'function'
                    ? col.cellClassName(row)
                    : col.cellClassName
                return (
                  <td
                    key={col.key}
                    className={['px-3 py-[0.42rem]', cellCls ?? ''].filter(Boolean).join(' ')}
                  >
                    {col.render(row)}
                  </td>
                )
              })}
            </tr>
          ))
        )}
      </tbody>
    </table>
  )
}
