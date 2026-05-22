import { AlertTriangle, CalendarCheck, ChevronRight, LogOut, Wrench, Users } from 'lucide-react'

import { Link } from '@tanstack/react-router'

import BrandLogo from '#/components/BrandLogo'
import { authClient } from '#/lib/auth-client'
import type { DashboardData, FleetCounts } from '#/lib/dashboard-functions'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function greeting(name: string): string {
  const h = new Date().getHours()
  const salutation = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  return `${salutation}, ${name}`
}

// ─── Fleet stat tile ──────────────────────────────────────────────────────────

const STATUS_META: {
  key: keyof FleetCounts
  label: string
  dotVar: string
  bgVar: string
  borderVar: string
}[] = [
  { key: 'available',   label: 'Available', dotVar: '--dot-available',   bgVar: '--status-available-bg',   borderVar: '--status-available-text' },
  { key: 'rented',      label: 'Rented',    dotVar: '--dot-rented',      bgVar: '--status-rented-bg',      borderVar: '--status-rented-text' },
  { key: 'reserved',    label: 'Reserved',  dotVar: '--dot-reserved',    bgVar: '--status-reserved-bg',    borderVar: '--status-reserved-text' },
  { key: 'maintenance', label: 'Maint.',    dotVar: '--dot-maintenance', bgVar: '--status-maintenance-bg', borderVar: '--status-maintenance-text' },
  { key: 'damaged',     label: 'Damaged',   dotVar: '--dot-damaged',     bgVar: '--status-damaged-bg',     borderVar: '--status-damaged-text' },
  { key: 'retired',     label: 'Retired',   dotVar: '--dot-retired',     bgVar: '--status-retired-bg',     borderVar: '--status-retired-text' },
]

function FleetTile({ label, count, dotVar, bgVar, borderVar }: { label: string; count: number; dotVar: string; bgVar: string; borderVar: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-1 rounded-2xl border px-3 py-3"
      style={{ background: `var(${bgVar})`, borderColor: `var(${borderVar})` }}
    >
      <span
        className="mb-0.5 inline-block size-2.5 rounded-full"
        style={{ background: `var(${dotVar})` }}
      />
      <span className="text-xl font-bold leading-none text-[var(--sea-ink)]">{count}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">{label}</span>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

type StaffDashboardProps = {
  user: { name: string }
  data: DashboardData
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StaffDashboard({ user, data }: StaffDashboardProps) {
  const { fleetCounts, dueToday, overdue, maintenanceAlerts } = data

  const totalActive = fleetCounts.rented + fleetCounts.reserved
  const redAlerts = maintenanceAlerts.filter((a) => a.severity === 'red')
  const amberAlerts = maintenanceAlerts.filter((a) => a.severity === 'amber')
  const hasUrgent = overdue.length > 0 || dueToday.length > 0 || redAlerts.length > 0 || amberAlerts.length > 0

  async function handleSignOut() {
    await authClient.signOut()
    window.location.href = '/'
  }

  return (
    <div className="hub-layout cxq-light-surface">
      <header className="hub-topbar">
        <div className="hub-brand">
          <BrandLogo size={28} />
          <span>XQ Fleet</span>
        </div>
        <div className="hub-topbar-end">
          <span className="role-pill">Staff</span>
          <button type="button" className="hub-signout" onClick={handleSignOut} aria-label="Sign out">
            <LogOut size={14} />
          </button>
        </div>
      </header>

      <div className="hub-content">
        <div className="hub-greeting">
          <p className="hub-greeting-text">{greeting(user.name)}</p>
          <p className="hub-greeting-sub">
            {hasUrgent
              ? "Here's what needs your attention today."
              : "You're all caught up — nothing urgent today."}
          </p>
        </div>

        {/* Priority inbox */}
        {(overdue.length > 0 || dueToday.length > 0 || maintenanceAlerts.length > 0) && (
          <section className="hub-section">
            <p className="hub-section-title">Priority inbox</p>
            <div className="hub-alerts">
              {overdue.length > 0 && (
                <Link
                  to="/app/rentals"
                  className="hub-alert hub-alert--red"
                >
                  <AlertTriangle size={14} />
                  <span>
                    {overdue.length} rental{overdue.length !== 1 ? 's' : ''} overdue
                  </span>
                  <ChevronRight size={13} className="hub-alert-arrow" />
                </Link>
              )}
              {dueToday.length > 0 && (
                <Link
                  to="/app/rentals"
                  className="hub-alert hub-alert--amber"
                >
                  <CalendarCheck size={14} />
                  <span>
                    {dueToday.length} return{dueToday.length !== 1 ? 's' : ''} due today
                  </span>
                  <ChevronRight size={13} className="hub-alert-arrow" />
                </Link>
              )}
              {redAlerts.length > 0 && (
                <Link to="/app/maintenance" className="hub-alert hub-alert--red">
                  <Wrench size={14} />
                  <span>
                    {redAlerts.length} maintenance issue{redAlerts.length !== 1 ? 's' : ''} urgent
                  </span>
                  <ChevronRight size={13} className="hub-alert-arrow" />
                </Link>
              )}
              {amberAlerts.length > 0 && (
                <Link to="/app/maintenance" className="hub-alert hub-alert--amber">
                  <Wrench size={14} />
                  <span>
                    {amberAlerts.length} maintenance alert{amberAlerts.length !== 1 ? 's' : ''}
                  </span>
                  <ChevronRight size={13} className="hub-alert-arrow" />
                </Link>
              )}
            </div>
          </section>
        )}

        {/* Quick actions */}
        <section className="hub-section">
          <p className="hub-section-title">Quick actions</p>
          <div className="hub-quick-actions">
            <Link to="/app/maintenance" className="hub-action-btn hub-action-btn--secondary">
              <Wrench size={20} />
              <span>Maintenance</span>
            </Link>
            <Link to="/app/rentals" className="hub-action-btn hub-action-btn--primary">
              <CalendarCheck size={20} />
              <span>Rentals</span>
            </Link>
            <Link to="/app/customers" className="hub-action-btn hub-action-btn--secondary">
              <Users size={20} />
              <span>Customers</span>
            </Link>
          </div>
        </section>

        {/* Fleet at a glance */}
        <section className="hub-section">
          <div className="hub-section-header">
            <p className="hub-section-title">Fleet at a glance</p>
            <span className="hub-section-sub">
              {totalActive} on road
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {STATUS_META.map(({ key, label, dotVar, bgVar, borderVar }) => (
              <FleetTile
                key={key}
                label={label}
                count={fleetCounts[key]}
                dotVar={dotVar}
                bgVar={bgVar}
                borderVar={borderVar}
              />
            ))}
          </div>
        </section>

        {/* Due today */}
        {dueToday.length > 0 && (
          <section className="hub-section">
            <p className="hub-section-title">Due back today</p>
            <div className="space-y-2">
              {dueToday.map((r) => (
                <Link
                  key={r.id}
                  to="/app/rentals/$rentalId"
                  params={{ rentalId: r.id }}
                  className="hub-alert hub-alert--amber justify-between"
                >
                  <div className="flex items-center gap-2">
                    <CalendarCheck size={13} />
                    <span className="font-mono font-semibold">{r.carPlateNumber ?? '—'}</span>
                    <span className="text-xs opacity-70">
                      {r.carMake} {r.carModel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{r.customerFullName ?? '—'}</span>
                    <ChevronRight size={13} className="hub-alert-arrow" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Overdue */}
        {overdue.length > 0 && (
          <section className="hub-section">
            <p className="hub-section-title">Overdue</p>
            <div className="space-y-2">
              {overdue.map((r) => (
                <Link
                  key={r.id}
                  to="/app/rentals/$rentalId"
                  params={{ rentalId: r.id }}
                  className="hub-alert hub-alert--red justify-between"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={13} />
                    <span className="font-mono font-semibold">{r.carPlateNumber ?? '—'}</span>
                    <span className="text-xs opacity-70">
                      {r.carMake} {r.carModel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold" style={{ color: 'var(--status-damaged-text)' }}>
                      +{r.daysOverdue}d
                    </span>
                    <span className="text-xs">{r.customerFullName ?? '—'}</span>
                    <ChevronRight size={13} className="hub-alert-arrow" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* All clear */}
        {dueToday.length === 0 && overdue.length === 0 && maintenanceAlerts.length === 0 && (
          <section className="hub-section">
            <div className="hub-empty-state">
              <CalendarCheck size={22} />
              <p>No returns due today and no overdue rentals.</p>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
