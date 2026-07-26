import { useMemo, useState } from 'react'

import { Link } from '@tanstack/react-router'
import {
  AlertTriangle,
  BarChart3,
  Clock,
  Download,
  History,
  Printer,
  RefreshCw,
  TrendingUp,
  Wrench,
} from 'lucide-react'

import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { type Column, DataTable } from '#/components/ui/DataTable'
import { PageHeader } from '#/components/ui/PageHeader'
import { StatusFilterTabs } from '#/components/ui/StatusFilterTabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import type {
  CarSelectRow,
  OverdueReportRow,
  RentalHistoryReport,
  RevenueReport,
  RevenueRow,
  UtilizationReport,
} from '#/lib/report-functions'
import {
  getOverdueReport,
  getRentalHistoryReport,
  getRevenueReport,
  getUtilizationReport,
} from '#/lib/report-functions'
import type { MaintenanceReport } from '#/lib/maintenance-functions'
import { getMaintenanceReport } from '#/lib/maintenance-functions'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMYR(sen: number): string {
  return `RM ${(sen / 100).toFixed(2)}`
}

function formatDate(d: Date | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

function toDateInput(d: Date): string {
  return d.toISOString().split('T')[0]
}

function thisMonthRange(): [string, string] {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return [toDateInput(from), toDateInput(to)]
}

function lastMonthRange(): [string, string] {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const to = new Date(now.getFullYear(), now.getMonth(), 0)
  return [toDateInput(from), toDateInput(to)]
}

function thisYearRange(): [string, string] {
  const now = new Date()
  return [`${now.getFullYear()}-01-01`, toDateInput(now)]
}

function downloadCsv(filename: string, rows: Record<string, string | number | null>[]) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const v = String(row[h] ?? '')
          return v.includes(',') || v.includes('"') || v.includes('\n')
            ? `"${v.replace(/"/g, '""')}"`
            : v
        })
        .join(','),
    ),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Date preset bar ──────────────────────────────────────────────────────────

type DateRange = [string, string]
type PresetKey = 'this-month' | 'last-month' | 'this-year' | 'custom'

function DatePresetBar({
  range,
  loading,
  onApply,
}: {
  range: DateRange
  loading: boolean
  onApply: (range: DateRange) => void
}) {
  const [selected, setSelected] = useState<PresetKey>('this-month')
  const [customFrom, setCustomFrom] = useState(range[0])
  const [customTo, setCustomTo] = useState(range[1])

  function applyPreset(key: PresetKey) {
    setSelected(key)
    if (key === 'this-month') onApply(thisMonthRange())
    else if (key === 'last-month') onApply(lastMonthRange())
    else if (key === 'this-year') onApply(thisYearRange())
  }

  const presets: { key: PresetKey; label: string }[] = [
    { key: 'this-month', label: 'This month' },
    { key: 'last-month', label: 'Last month' },
    { key: 'this-year', label: 'This year' },
    { key: 'custom', label: 'Custom' },
  ]

  return (
    <div className="report-date-bar">
      <StatusFilterTabs
        aria-label="Date range preset"
        value={selected}
        onValueChange={(key) => applyPreset(key)}
        tabs={presets.map((p) => ({ value: p.key, label: p.label }))}
      />
      {selected === 'custom' && (
        <div className="report-date-custom">
          <input
            type="date"
            className="field-input"
            value={customFrom}
            max={customTo}
            onChange={(e) => setCustomFrom(e.target.value)}
          />
          <span className="text-sm text-[var(--sea-ink-soft)]">to</span>
          <input
            type="date"
            className="field-input"
            value={customTo}
            min={customFrom}
            onChange={(e) => setCustomTo(e.target.value)}
          />
          <button
            type="button"
            className="button-primary flex items-center gap-2"
            disabled={loading || !customFrom || !customTo}
            onClick={() => onApply([customFrom, customTo])}
          >
            {loading ? <RefreshCw size={13} className="animate-spin" /> : null}
            Run report
          </button>
        </div>
      )}
      {selected !== 'custom' && loading && (
        <div className="flex items-center gap-1.5 text-xs text-[var(--sea-ink-soft)]">
          <RefreshCw size={12} className="animate-spin" />
          Loading…
        </div>
      )}
    </div>
  )
}

// ─── Status badge (inline) ────────────────────────────────────────────────────

const STATUS_COLOURS: Record<string, { bg: string; text: string; border: string }> = {
  closed: { bg: '#f0faf4', text: '#2a7a55', border: '#bbedd0' },
  active: { bg: '#f0f9fa', text: 'var(--lagoon-deep)', border: '#b3e4e8' },
  pending: { bg: '#fdf7ed', text: '#b07020', border: '#f3d7a0' },
  cancelled: { bg: '#f5f5f4', text: '#777', border: '#d5d9d5' },
  partial: { bg: '#fdf7ed', text: '#b07020', border: '#f3d7a0' },
  unpaid: { bg: '#fdf1f1', text: '#c44', border: '#f5c5c5' },
}

function StatusPill({ status }: { status: string }) {
  const c = STATUS_COLOURS[status] ?? STATUS_COLOURS.cancelled
  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold capitalize"
      style={{ background: c.bg, color: c.text, borderColor: c.border }}
    >
      {status}
    </span>
  )
}

// ─── Report export bar ────────────────────────────────────────────────────────

function ExportBar({ onCsv }: { onCsv: () => void }) {
  return (
    <div className="report-export-bar print:hidden">
      <button type="button" className="button-secondary flex items-center gap-2" onClick={onCsv}>
        <Download size={13} />
        CSV
      </button>
      <button
        type="button"
        className="button-secondary flex items-center gap-2"
        onClick={() => window.print()}
      >
        <Printer size={13} />
        Print
      </button>
    </div>
  )
}

// ─── Report stat card ─────────────────────────────────────────────────────────

function ReportStatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card
      size="sm"
      className="rounded-[var(--radius-xl,1rem)] shadow-[var(--shadow-md)] ring-1 ring-[var(--border,rgba(17,17,16,0.10))]"
    >
      <CardHeader className="pb-0">
        <CardDescription className="text-sm font-medium text-[var(--sea-ink-soft)]">
          {label}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-1">
        <CardTitle className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--sea-ink)]">
          {value}
        </CardTitle>
      </CardContent>
    </Card>
  )
}

// ─── Revenue table columns ────────────────────────────────────────────────────

const REVENUE_COLUMNS: Column<RevenueRow>[] = [
  {
    key: 'actualReturnDate',
    header: 'Date closed',
    render: (r) => formatDate(r.actualReturnDate),
  },
  {
    key: 'car',
    header: 'Car',
    render: (r) => (
      <>
        <Link to="/internal/jobs/$jobId" params={{ jobId: r.id }} className="plate-link">
          {r.carPlateNumber ?? '—'}
        </Link>
        <span className="vehicle-model">{r.carMake} {r.carModel}</span>
      </>
    ),
  },
  {
    key: 'customerFullName',
    header: 'Customer',
    cellClassName: 'text-sm',
    render: (r) => r.customerFullName ?? '—',
  },
  {
    key: 'totalAmountSen',
    header: 'Total',
    headerClassName: 'text-right',
    cellClassName: 'text-right text-sm',
    render: (r) => formatMYR(r.totalAmountSen),
  },
  {
    key: 'paidAmountSen',
    header: 'Collected',
    headerClassName: 'text-right',
    cellClassName: 'text-right font-semibold',
    render: (r) => formatMYR(r.paidAmountSen),
  },
]

// ─── Revenue tab ──────────────────────────────────────────────────────────────

function RevenueTab({
  initialData,
}: {
  initialData: RevenueReport
}) {
  const [[from, to], setRange] = useState<DateRange>(thisMonthRange())
  const [data, setData] = useState<RevenueReport>(initialData)
  const [loading, setLoading] = useState(false)

  async function load(range: DateRange) {
    setRange(range)
    setLoading(true)
    try {
      const result = await getRevenueReport({ data: { from: range[0], to: range[1] } })
      setData(result)
    } finally {
      setLoading(false)
    }
  }

  const totalCollected = useMemo(
    () => data.rows.reduce((s, r) => s + r.paidAmountSen, 0),
    [data.rows],
  )
  const totalBilled = useMemo(
    () => data.rows.reduce((s, r) => s + r.totalAmountSen, 0),
    [data.rows],
  )

  const byCategory = useMemo(() => {
    const map: Record<string, { billed: number; collected: number; count: number }> = {}
    for (const r of data.rows) {
      const cat = r.carCategory ?? 'other'
      if (!map[cat]) map[cat] = { billed: 0, collected: 0, count: 0 }
      map[cat].billed += r.totalAmountSen
      map[cat].collected += r.paidAmountSen
      map[cat].count++
    }
    return Object.entries(map).sort((a, b) => b[1].collected - a[1].collected)
  }, [data.rows])

  const totalOutstanding = useMemo(
    () => data.outstanding.reduce((s, r) => s + (r.totalAmountSen - r.paidAmountSen), 0),
    [data.outstanding],
  )

  function exportCsv() {
    downloadCsv(`revenue-${from}-to-${to}.csv`, data.rows.map((r) => ({
      Date: formatDate(r.actualReturnDate),
      Car: `${r.carPlateNumber} ${r.carMake} ${r.carModel}`,
      Category: r.carCategory ?? '',
      Customer: r.customerFullName ?? '',
      'Total (RM)': (r.totalAmountSen / 100).toFixed(2),
      'Paid (RM)': (r.paidAmountSen / 100).toFixed(2),
      'Deposit (RM)': (r.depositAmountSen / 100).toFixed(2),
    })))
  }

  return (
    <div className="report-tab-content" id="print-area">
      <DatePresetBar range={[from, to]} loading={loading} onApply={load} />

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
        <ReportStatCard label="Revenue collected" value={formatMYR(totalCollected)} />
        <ReportStatCard label="Total billed" value={formatMYR(totalBilled)} />
        <ReportStatCard label="Closed rentals" value={String(data.rows.length)} />
      </div>

      {/* Category breakdown */}
      {byCategory.length > 0 && (
        <section className="workspace-panel island-shell mb-4">
          <p className="island-kicker mb-3">Breakdown by category</p>
          <div className="space-y-2">
            {byCategory.map(([cat, s]) => (
              <div key={cat} className="list-row">
                <div>
                  <span className="font-semibold capitalize text-[var(--sea-ink)]">{cat}</span>
                  <span className="ml-2 text-xs text-[var(--sea-ink-soft)]">{s.count} rental{s.count !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-[var(--sea-ink-soft)]">Billed {formatMYR(s.billed)}</span>
                  <span className="font-semibold text-[var(--sea-ink)]">{formatMYR(s.collected)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Rental rows */}
      <section className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="island-kicker">Closed rentals</p>
          {data.rows.length > 0 && <ExportBar onCsv={exportCsv} />}
        </div>
        <article className="workspace-panel island-shell overflow-x-auto p-0">
          <DataTable
            columns={REVENUE_COLUMNS}
            data={data.rows}
            getKey={(r) => r.id}
            emptyState={
              <p className="text-sm text-[var(--sea-ink-soft)]">No closed rentals in this period.</p>
            }
          />
        </article>
      </section>

      {/* Outstanding balances */}
      {data.outstanding.length > 0 && (
        <section className="workspace-panel island-shell border-amber-200" style={{ borderColor: '#f3d7a0' }}>
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-500" />
            <p className="island-kicker">Outstanding balances</p>
            <span className="ml-auto font-semibold text-amber-700">{formatMYR(totalOutstanding)} unpaid</span>
          </div>
          <div className="space-y-2">
            {data.outstanding.map((r) => (
              <div key={r.id} className="list-row">
                <div>
                  <Link to="/internal/jobs/$jobId" params={{ jobId: r.id }} className="plate-link">
                    {r.carPlateNumber ?? '—'}
                  </Link>
                  <span className="ml-2 text-sm text-[var(--sea-ink-soft)]">{r.carMake} {r.carModel}</span>
                  <span className="ml-2 text-sm text-[var(--sea-ink-soft)]">· {r.customerFullName ?? '—'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill status={r.status} />
                  <span className="text-sm">Due {formatDate(r.endDate)}</span>
                  <span className="font-semibold text-amber-700">
                    {formatMYR(r.totalAmountSen - r.paidAmountSen)} owed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// ─── Utilization tab ──────────────────────────────────────────────────────────

function UtilizationTab() {
  const [[from, to], setRange] = useState<DateRange>(thisMonthRange())
  const [data, setData] = useState<UtilizationReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  async function load(range: DateRange) {
    setRange(range)
    setLoading(true)
    try {
      const result = await getUtilizationReport({ data: { from: range[0], to: range[1] } })
      setData(result)
      setLoaded(true)
    } finally {
      setLoading(false)
    }
  }

  function exportCsv() {
    if (!data) return
    downloadCsv(`utilization-${from}-to-${to}.csv`, data.rows.map((r) => ({
      'Plate': r.plateNumber,
      'Make/Model': `${r.make} ${r.model}`,
      'Category': r.category,
      'Rentals': r.rentalCount,
      'Days Rented': r.totalDaysRented,
      'Period Days': data.periodDays,
      'Utilization %': ((r.totalDaysRented / data.periodDays) * 100).toFixed(1),
    })))
  }

  return (
    <div className="report-tab-content">
      <DatePresetBar range={[from, to]} loading={loading} onApply={load} />

      {!loaded && !loading && (
        <div className="report-empty-prompt">
          <p>Select a period and the report will load automatically.</p>
        </div>
      )}

      {data && (
        <>
          <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
            <ReportStatCard label="Period days" value={String(data.periodDays)} />
            <ReportStatCard
              label="Total rentals"
              value={String(data.rows.reduce((s, r) => s + r.rentalCount, 0))}
            />
            <ReportStatCard label="Fleet size" value={String(data.rows.length)} />
          </div>

          <section className="workspace-panel island-shell">
            <div className="mb-3 flex items-center justify-between">
              <p className="island-kicker">Per-vehicle utilization</p>
              <ExportBar onCsv={exportCsv} />
            </div>
            <div className="overflow-x-auto">
              <table className="cars-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Category</th>
                    <th className="text-right">Rentals</th>
                    <th className="text-right">Days rented</th>
                    <th>Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => {
                    const rate = data.periodDays > 0 ? (r.totalDaysRented / data.periodDays) * 100 : 0
                    return (
                      <tr key={r.carId}>
                        <td>
                          <span className="font-mono font-semibold text-[var(--sea-ink)]">{r.plateNumber}</span>
                          <span className="vehicle-model">{r.make} {r.model}</span>
                        </td>
                        <td className="capitalize text-sm">{r.category}</td>
                        <td className="text-right">{r.rentalCount}</td>
                        <td className="text-right">{r.totalDaysRented}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="report-util-bar">
                              <div
                                className="report-util-fill"
                                style={{ width: `${Math.min(100, rate).toFixed(1)}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-[var(--sea-ink)]">
                              {rate.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

// ─── Overdue tab ──────────────────────────────────────────────────────────────

function OverdueTab() {
  const [data, setData] = useState<OverdueReportRow[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const result = await getOverdueReport()
      setData(result)
      setLoaded(true)
    } finally {
      setLoading(false)
    }
  }

  function exportCsv() {
    if (!data) return
    downloadCsv('overdue-rentals.csv', data.map((r) => ({
      Car: `${r.carPlateNumber} ${r.carMake} ${r.carModel}`,
      Customer: r.customerFullName ?? '',
      'Due Date': formatDate(r.endDate),
      'Days Overdue': r.daysOverdue,
      'Total (RM)': (r.totalAmountSen / 100).toFixed(2),
      'Paid (RM)': (r.paidAmountSen / 100).toFixed(2),
      'Outstanding (RM)': ((r.totalAmountSen - r.paidAmountSen) / 100).toFixed(2),
    })))
  }

  return (
    <div className="report-tab-content">
      <div className="report-date-bar">
        <p className="text-sm text-[var(--sea-ink-soft)]">Shows all currently overdue active rentals.</p>
        <button
          type="button"
          className="button-primary flex items-center gap-2"
          disabled={loading}
          onClick={load}
        >
          {loading ? <RefreshCw size={13} className="animate-spin" /> : null}
          {loaded ? 'Refresh' : 'Load report'}
        </button>
      </div>

      {data && (
        <section className="workspace-panel island-shell">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-red-500" />
              <p className="island-kicker">{data.length} overdue rental{data.length !== 1 ? 's' : ''}</p>
            </div>
            {data.length > 0 && <ExportBar onCsv={exportCsv} />}
          </div>
          {data.length === 0 ? (
            <p className="text-sm text-[var(--sea-ink-soft)]">No overdue rentals right now.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="cars-table">
                <thead>
                  <tr>
                    <th>Car</th>
                    <th>Customer</th>
                    <th>Due date</th>
                    <th className="text-right">Days late</th>
                    <th className="text-right">Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <Link
                          to="/internal/jobs/$jobId"
                          params={{ jobId: r.id }}
                          params={{ rentalId: r.id }}
                          className="plate-link"
                        >
                          {r.carPlateNumber ?? '—'}
                        </Link>
                        <span className="vehicle-model">{r.carMake} {r.carModel}</span>
                      </td>
                      <td className="text-sm">{r.customerFullName ?? '—'}</td>
                      <td className="text-sm">{formatDate(r.endDate)}</td>
                      <td className="text-right">
                        <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                          +{r.daysOverdue}d
                        </span>
                      </td>
                      <td className="text-right font-semibold text-red-600">
                        {formatMYR(r.totalAmountSen - r.paidAmountSen)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

// ─── Rental history tab ───────────────────────────────────────────────────────

function HistoryTab({ allCars }: { allCars: CarSelectRow[] }) {
  const [selectedCarId, setSelectedCarId] = useState('')
  const [data, setData] = useState<RentalHistoryReport | null>(null)
  const [loading, setLoading] = useState(false)

  async function load(carId: string, page: number) {
    setLoading(true)
    try {
      const result = await getRentalHistoryReport({ data: { carId, page } })
      setData(result)
    } finally {
      setLoading(false)
    }
  }

  function handleCarChange(carId: string) {
    setSelectedCarId(carId)
    setData(null)
    if (carId) load(carId, 1)
  }

  const selectedCar = allCars.find((c) => c.id === selectedCarId)

  function exportCsv() {
    if (!data || !selectedCar) return
    downloadCsv(`history-${selectedCar.plateNumber}.csv`, data.rows.map((r) => ({
      Customer: r.customerFullName ?? '',
      Status: r.status,
      'Start date': formatDate(r.startDate),
      'End date': formatDate(r.endDate),
      'Return date': formatDate(r.actualReturnDate),
      'Total (RM)': (r.totalAmountSen / 100).toFixed(2),
      'Paid (RM)': (r.paidAmountSen / 100).toFixed(2),
      'Deposit (RM)': (r.depositAmountSen / 100).toFixed(2),
    })))
  }

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0

  return (
    <div className="report-tab-content">
      <div className="report-date-bar">
        <div className="w-full max-w-xs">
          <label className="field-label" htmlFor="history-car">Select vehicle</label>
          <select
            id="history-car"
            className="field-input"
            value={selectedCarId}
            onChange={(e) => handleCarChange(e.target.value)}
          >
            <option value="">Choose a vehicle…</option>
            {allCars.map((c) => (
              <option key={c.id} value={c.id}>
                {c.plateNumber} — {c.make} {c.model}
              </option>
            ))}
          </select>
        </div>
        {loading && (
          <div className="flex items-center gap-1.5 text-xs text-[var(--sea-ink-soft)]">
            <RefreshCw size={12} className="animate-spin" />
            Loading…
          </div>
        )}
      </div>

      {data && selectedCar && (
        <section className="workspace-panel island-shell">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="island-kicker mb-0.5">Rental history</p>
              <p className="font-semibold text-[var(--sea-ink)]">
                <span className="font-mono">{selectedCar.plateNumber}</span>{' '}
                <span className="font-normal text-[var(--sea-ink-soft)]">{selectedCar.make} {selectedCar.model}</span>
              </p>
              <p className="text-sm text-[var(--sea-ink-soft)]">{data.total} total rental{data.total !== 1 ? 's' : ''}</p>
            </div>
            {data.rows.length > 0 && <ExportBar onCsv={exportCsv} />}
          </div>

          {data.rows.length === 0 ? (
            <p className="text-sm text-[var(--sea-ink-soft)]">No rentals found for this vehicle.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="cars-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Period</th>
                      <th>Status</th>
                      <th className="text-right">Total</th>
                      <th className="text-right">Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((r) => (
                      <tr key={r.id}>
                        <td className="text-sm">{r.customerFullName ?? '—'}</td>
                        <td className="text-sm">
                          {formatDate(r.startDate)} → {formatDate(r.endDate)}
                        </td>
                        <td>
                          <StatusPill status={r.status} />
                        </td>
                        <td className="text-right text-sm">{formatMYR(r.totalAmountSen)}</td>
                        <td className="text-right font-semibold">{formatMYR(r.paidAmountSen)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="report-pagination">
                  <button
                    type="button"
                    className="button-secondary"
                    disabled={data.page <= 1 || loading}
                    onClick={() => load(selectedCarId, data.page - 1)}
                  >
                    Previous
                  </button>
                  <span className="text-sm text-[var(--sea-ink-soft)]">
                    Page {data.page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    className="button-secondary"
                    disabled={data.page >= totalPages || loading}
                    onClick={() => load(selectedCarId, data.page + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  )
}

// ─── Maintenance tab ──────────────────────────────────────────────────────────

function MaintenanceTab() {
  const [from, setFrom] = useState(thisMonthRange()[0])
  const [to, setTo] = useState(thisMonthRange()[1])
  const [data, setData] = useState<MaintenanceReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadReport() {
    setLoading(true)
    setError(null)
    try {
      const result = await getMaintenanceReport({ data: { from, to } })
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report.')
    } finally {
      setLoading(false)
    }
  }

  function downloadCsv() {
    if (!data) return
    const rows = data.rows.map((r) => ({
      Date: r.openedAt.toLocaleDateString('en-MY'),
      'Completed Date': r.completedAt ? r.completedAt.toLocaleDateString('en-MY') : '',
      Vehicle: r.carPlateNumber ?? '',
      Make: r.carMake ?? '',
      Model: r.carModel ?? '',
      Type: r.type,
      Description: r.description,
      'Cost (RM)': (r.costSen / 100).toFixed(2),
      Workshop: r.workshopVendor ?? '',
      Status: r.status,
    }))
    const headers = Object.keys(rows[0] ?? {})
    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        headers.map((h) => {
          const val = String(r[h as keyof typeof r] ?? '')
          return val.includes(',') ? `"${val}"` : val
        }).join(','),
      ),
    ].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `maintenance-${from}-to-${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="workspace-panel island-shell mb-6 p-5">
        <p className="island-kicker mb-4">Date range</p>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="field-label" htmlFor="maint-from">From</label>
            <input
              id="maint-from"
              type="date"
              className="field-input"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="maint-to">To</label>
            <input
              id="maint-to"
              type="date"
              className="field-input"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="button-primary inline-flex items-center gap-2"
            onClick={loadReport}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Loading…' : 'Run report'}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {data && (
        <div className="workspace-panel island-shell p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="island-kicker mb-0.5">Results</p>
              <h3 className="text-xl font-semibold text-[var(--sea-ink)]">
                {data.rows.length} event{data.rows.length !== 1 ? 's' : ''} · Total: {formatMYR(data.totalCostSen)}
              </h3>
            </div>
            <div className="flex gap-2 print:hidden">
              <button
                type="button"
                className="button-secondary inline-flex items-center gap-1.5 text-sm"
                onClick={downloadCsv}
              >
                <Download size={13} />
                CSV
              </button>
              <button
                type="button"
                className="button-secondary inline-flex items-center gap-1.5 text-sm"
                onClick={() => window.print()}
              >
                <Printer size={13} />
                Print
              </button>
            </div>
          </div>

          {data.rows.length === 0 ? (
            <p className="text-sm text-[var(--sea-ink-soft)]">No maintenance events in this period.</p>
          ) : (
            <div className="maint-event-table">
              <div className="maint-event-table-header">
                <span>Date</span>
                <span>Vehicle</span>
                <span>Type</span>
                <span>Description</span>
                <span>Cost</span>
                <span>Status</span>
              </div>
              {data.rows.map((r) => (
                <div key={r.id} className="maint-event-row">
                  <span className="text-xs tabular-nums text-[var(--sea-ink-soft)]">
                    {new Date(r.openedAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="font-mono text-xs font-semibold text-[var(--lagoon-deep)]">
                    {r.carPlateNumber ?? '—'} <span className="font-normal text-[var(--sea-ink-soft)]">{r.carMake} {r.carModel}</span>
                  </span>
                  <span className="text-xs">{r.type}</span>
                  <span className="text-sm">{r.description}</span>
                  <span className="text-xs tabular-nums">{r.costSen > 0 ? formatMYR(r.costSen) : '—'}</span>
                  <span className={`maint-status-badge maint-status-badge--${r.status}`}>
                    {r.status === 'open' ? 'Open' : 'Done'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Tab types ────────────────────────────────────────────────────────────────

type ReportTab = 'revenue' | 'utilization' | 'overdue' | 'history' | 'maintenance'

const TABS: {
  key: ReportTab
  label: string
  icon: typeof TrendingUp
}[] = [
  { key: 'revenue', label: 'Revenue', icon: TrendingUp },
  { key: 'utilization', label: 'Utilization', icon: BarChart3 },
  { key: 'overdue', label: 'Overdue', icon: Clock },
  { key: 'history', label: 'Rental History', icon: History },
  { key: 'maintenance', label: 'Maintenance', icon: Wrench },
]

// ─── Props ────────────────────────────────────────────────────────────────────

type AdminReportsProps = {
  session: { user: { name: string; email: string; role: string } }
  initialRevenue: RevenueReport
  allCars: CarSelectRow[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminReports({ session, initialRevenue, allCars }: AdminReportsProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>('revenue')

  return (
    <AdminSidebarShell user={session.user} pageTitle="Reports">
      <PageHeader kicker="Analytics" title="Reports" description="Owner-only analytics and export tools." />

      {/* Tab switcher */}
      <StatusFilterTabs
        className="mb-6 print:hidden"
        aria-label="Report type"
        value={activeTab}
        onValueChange={setActiveTab}
        tabs={TABS.map((t) => ({
          value: t.key,
          label: t.label,
          icon: t.icon,
        }))}
      />

      {/* Tab panels */}
      {activeTab === 'revenue' && <RevenueTab initialData={initialRevenue} />}
      {activeTab === 'utilization' && <UtilizationTab />}
      {activeTab === 'overdue' && <OverdueTab />}
      {activeTab === 'history' && <HistoryTab allCars={allCars} />}
      {activeTab === 'maintenance' && <MaintenanceTab />}
    </AdminSidebarShell>
  )
}
