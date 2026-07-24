import {
  AlertTriangle,
  CalendarCheck,
  Car,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import type { AdminDashboardKpis } from '#/lib/admin-dashboard-functions'
import { cn } from '#/lib/utils'

function formatMYR(sen: number): string {
  return `RM ${(sen / 100).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDelta(pct: number | null): {
  label: string
  cls: 'is-up' | 'is-down' | 'is-flat'
} {
  if (pct == null) return { label: 'n/a vs last month', cls: 'is-flat' }
  const rounded = Math.round(pct * 10) / 10
  if (rounded > 0)
    return {
      label: `▲ ${rounded.toFixed(1)}% vs last month`,
      cls: 'is-up',
    }
  if (rounded < 0)
    return {
      label: `▼ ${Math.abs(rounded).toFixed(1)}% vs last month`,
      cls: 'is-down',
    }
  return { label: '— flat vs last month', cls: 'is-flat' }
}

type KpiCardProps = {
  label: string
  value: string
  icon: React.ReactNode
  delta?: { label: string; cls: 'is-up' | 'is-down' | 'is-flat' }
}

function KpiCard({ label, value, icon, delta }: KpiCardProps) {
  return (
    <Card
      size="sm"
      className={cn(
        'rounded-[var(--radius-xl,1rem)] shadow-[var(--shadow-md)] ring-1 ring-[var(--border,rgba(17,17,16,0.10))] transition-[transform,box-shadow] duration-200 ease-out',
        'hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]',
        'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-0">
        <CardDescription className="text-[0.7rem] font-semibold tracking-[0.08em] text-[var(--sea-ink-soft)] uppercase">
          {label}
        </CardDescription>
        <span className="text-[var(--sea-ink-soft)] opacity-60">{icon}</span>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 pt-1">
        <CardTitle className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--sea-ink)]">
          {value}
        </CardTitle>
        {delta ? (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-xs',
              delta.cls === 'is-up' && 'text-[var(--success)]',
              delta.cls === 'is-down' && 'text-[var(--error)]',
              delta.cls === 'is-flat' && 'text-[var(--sea-ink-soft)]',
            )}
          >
            {delta.cls === 'is-up' ? (
              <TrendingUp className="size-3" aria-hidden />
            ) : null}
            {delta.cls === 'is-down' ? (
              <TrendingDown className="size-3" aria-hidden />
            ) : null}
            {delta.label}
          </span>
        ) : null}
      </CardContent>
    </Card>
  )
}

type AdminKpiGridProps = {
  kpis: AdminDashboardKpis
}

export function AdminKpiGrid({ kpis }: AdminKpiGridProps) {
  const delta = formatDelta(kpis.mtdRevenueMomDeltaPct)

  return (
    <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
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
