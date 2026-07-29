import { useCallback, useState } from 'react'
import { ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { cn } from '#/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Column<T> {
  key: string
  header: string
  headerContent?: React.ReactNode
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
  if (!active)
    return <ArrowUpDown className="ml-1 inline size-[11px] opacity-35" />
  return dir === 'asc' ? (
    <ChevronUp className="ml-1 inline size-[11px] text-[var(--ui-ink)]" />
  ) : (
    <ChevronDown className="ml-1 inline size-[11px] text-[var(--ui-ink)]" />
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
    <Table className={cn('ui-table cars-table', className)}>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {columns.map((col) => {
            const ariaSort =
              col.sortable && sortKey === col.key
                ? sortDir === 'asc'
                  ? 'ascending'
                  : 'descending'
                : col.sortable
                  ? 'none'
                  : undefined

            return (
              <TableHead
                key={col.key}
                aria-sort={ariaSort}
                className={cn(
                  col.sortable && 'sortable cursor-pointer select-none',
                  col.headerClassName,
                )}
                onClick={
                  col.sortable && onSort ? () => onSort(col.key) : undefined
                }
              >
                {col.sortable ? (
                  <span className="inline-flex items-center">
                    {col.header}
                    <SortIcon active={sortKey === col.key} dir={sortDir} />
                  </span>
                ) : col.headerContent ? (
                  col.headerContent
                ) : (
                  col.header
                )}
              </TableHead>
            )
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          emptyState ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="p-0">
                <div className="hub-empty-state flex min-h-[10rem] flex-col items-center justify-center gap-2 p-6 text-center text-[length:var(--admin-text)] text-[var(--ui-muted)]">
                  {emptyState}
                </div>
              </TableCell>
            </TableRow>
          ) : null
        ) : (
          data.map((row) => (
            <TableRow
              key={getKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(onRowClick && 'is-clickable cursor-pointer')}
            >
              {columns.map((col) => {
                const cellCls =
                  typeof col.cellClassName === 'function'
                    ? col.cellClassName(row)
                    : col.cellClassName
                return (
                  <TableCell key={col.key} className={cellCls}>
                    {col.render(row)}
                  </TableCell>
                )
              })}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
