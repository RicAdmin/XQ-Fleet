import { useMemo, useState } from 'react'

import { Link } from '@tanstack/react-router'

import { AdminListFilterBar } from '#/components/ui/AdminListFilterBar'
import { type Column, DataTable } from '#/components/ui/DataTable'
import { StatusBadge } from '#/components/ui/StatusBadge'
import {
  OperationCustomerCell,
  OperationMoneyCell,
  OperationPaymentCell,
  OperationScheduleCell,
  type OperationQueueFilters,
} from '#/components/admin/operations-queue-utils'
import { formatJobType } from '#/lib/job-display'
import type { RentalListRow } from '#/lib/rental-functions'

type AllJobsTabProps = {
  rows: RentalListRow[]
}

function filterAllRows(rows: RentalListRow[], filters: OperationQueueFilters) {
  const search = filters.search?.trim().toLowerCase()
  if (!search) return rows
  return rows.filter((row) => {
    const haystack = [
      row.customerFullName,
      row.customerPhone,
      row.customerIcOrPassport,
      row.customerEmail,
      row.carPlateNumber,
      row.carMake,
      row.carModel,
      row.pickUpLocation,
      row.returnLocation,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(search)
  })
}

export function AllJobsTab({ rows }: AllJobsTabProps) {
  const [filters, setFilters] = useState<OperationQueueFilters>({})
  const [searchInput, setSearchInput] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const filteredRows = useMemo(
    () =>
      filterAllRows(rows, {
        ...filters,
        search: searchInput.trim() || filters.search,
      }),
    [rows, filters, searchInput],
  )

  const columns = useMemo<Column<RentalListRow>[]>(
    () => [
      {
        key: 'status',
        header: 'Status',
        render: (r) => <StatusBadge status={r.status} />,
      },
      {
        key: 'customer',
        header: 'Customer',
        cellClassName: 'admin-op-col-customer whitespace-normal',
        render: (r) => <OperationCustomerCell rental={r} />,
      },
      {
        key: 'car',
        header: 'Car',
        cellClassName: 'admin-op-col-car whitespace-normal',
        render: (r) => (
          <div>
            <div className="admin-op-plate font-semibold">{r.carPlateNumber ?? '—'}</div>
            <div className="text-[var(--admin-text-sm)] text-[var(--sea-ink-soft)]">
              {r.carMake} {r.carModel}
            </div>
          </div>
        ),
      },
      {
        key: 'type',
        header: 'Type',
        render: (r) => <span className="category-pill">{formatJobType(r.type)}</span>,
      },
      {
        key: 'schedule',
        header: 'Schedule',
        cellClassName: 'admin-op-col-schedule whitespace-normal',
        render: (r) => <OperationScheduleCell rental={r} />,
      },
      {
        key: 'paymentStatus',
        header: 'Payment',
        render: (r) => <OperationPaymentCell rental={r} />,
      },
      {
        key: 'total',
        header: 'Total',
        headerClassName: 'text-right',
        cellClassName: 'admin-op-col-money text-right',
        render: (r) => <OperationMoneyCell amountSen={r.totalAmountSen} />,
      },
      {
        key: 'view',
        header: '',
        cellClassName: 'text-right',
        render: (r) => (
          <Link
            to="/internal/jobs/$jobId"
            params={{ jobId: r.id }}
            className="text-sm font-semibold text-[var(--lagoon-deep)] no-underline hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            View
          </Link>
        ),
      },
    ],
    [],
  )

  return (
    <div className="flex flex-col gap-3">
      <article className="workspace-panel island-shell admin-ops-panel p-0">
        <AdminListFilterBar
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Customer, phone, IC, or plate…"
          searchAriaLabel="Search open jobs"
          filtersOpen={filtersOpen}
          onFiltersOpenChange={setFiltersOpen}
          activeFilterCount={0}
          hasActiveFilters={Boolean(searchInput.trim())}
          onClearFilters={() => setSearchInput('')}
        />
        <DataTable
          className="admin-ops-table w-max min-w-full"
          columns={columns}
          data={filteredRows}
          getKey={(r) => r.id}
          emptyState={
            <div className="text-center text-sm text-muted-foreground">
              No open jobs right now.
            </div>
          }
        />
        <div className="admin-infinite-status">
          {`${filteredRows.length.toLocaleString()} open job${filteredRows.length === 1 ? '' : 's'} · end of list`}
        </div>
      </article>
    </div>
  )
}
