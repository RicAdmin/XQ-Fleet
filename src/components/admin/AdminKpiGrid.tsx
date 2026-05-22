import {
  AlertTriangle,
  CalendarCheck,
  Car,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'

import type { AdminDashboardKpis } from '#/lib/admin-dashboard-functions'

function formatMYR(sen: number): string {
  return `RM ${(sen / 100).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDelta(pct: number | null): {
  label: string
  cls: 'is-up' | 'is-down' | 'is-flat'
  icon: typeof TrendingUp
} {
  if (pct == null) return { label: 'n/a vs last month', cls: 'is-flat', icon: TrendingUp }
  const rounded = Math.round(pct * 10) / 10
  if (rounded > 0)
    return {
      label: `▲ ${rounded.toFixed(1)}% vs last month`,
      cls: 'is-up',
      icon: TrendingUp,
    }
  if (rounded < 0)
    return {
      label: `▼ ${Math.abs(rounded).toFixed(1)}% vs last month`,
      cls: 'is-down',
      icon: TrendingDown,
    }
  return { label: '— flat vs last month', cls: 'is-flat', icon: TrendingUp }
}

type KpiCardProps = {
  label: string
  value: string
  icon: React.ReactNode
  delta?: { label: string; cls: 'is-up' | 'is-down' | 'is-flat' }
}

function KpiCard({ label, value, icon, delta }: KpiCardProps) {
  return (
    <div className="kpi-card">
      <div className="flex items-center justify-between">
        <span className="kpi-card-label">{label}</span>
        <span className="text-[var(--sea-ink-soft)] opacity-60">{icon}</span>
      </div>
      <span className="kpi-card-value">{value}</span>
      {delta && <span className={`kpi-card-delta ${delta.cls}`}>{delta.label}</span>}
    </div>
  )
}

type AdminKpiGridProps = {
  kpis: AdminDashboardKpis
}

export function AdminKpiGrid({ kpis }: AdminKpiGridProps) {
  const delta = formatDelta(kpis.mtdRevenueMomDeltaPct)

  return (
    <div className="kpi-grid">
      <KpiCard
        label="Bookings today"
        value={String(kpis.bookingsToday)}
        icon={<CalendarCheck size={16} />}
      />
      <KpiCard
        label="MTD Revenue"
        value={formatMYR(kpis.mtdRevenueSen)}
        icon={<Wallet size={16} />}
        delta={{ label: delta.label, cls: delta.cls }}
      />
      <KpiCard
        label="Active rentals"
        value={String(kpis.activeRentals)}
        icon={<Car size={16} />}
      />
      <KpiCard
        label="Overdue rentals"
        value={String(kpis.overdueRentals)}
        icon={<AlertTriangle size={16} />}
      />
      <KpiCard
        label="Pending refunds"
        value={String(kpis.pendingRefunds)}
        icon={<Wallet size={16} />}
      />
    </div>
  )
}
