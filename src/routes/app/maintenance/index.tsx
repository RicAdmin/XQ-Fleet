import { useState } from 'react'

import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { AlertTriangle, Car, ChevronRight, Wrench } from 'lucide-react'

import type { MaintenanceAlertRow, MaintenanceEventRow } from '#/lib/maintenance-functions'
import { getAllMaintenanceEvents, getMaintenanceDashboardAlerts } from '#/lib/maintenance-functions'

export const Route = createFileRoute('/app/maintenance/')({
  beforeLoad: async ({ context }) => {
    const { session } = context as unknown as { session: { user: { role: string; name: string; email: string } } | null }
    if (!session) throw redirect({ to: '/internal/login' })
    const [events, alerts] = await Promise.all([
      getAllMaintenanceEvents({ data: { statusFilter: 'all' } }),
      getMaintenanceDashboardAlerts(),
    ])
    return { events, alerts }
  },
  component: MaintenanceHubPage,
})

type EventFilter = 'all' | 'open' | 'completed'

function formatDate(d: Date | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatMYR(sen: number): string {
  return `RM ${(sen / 100).toFixed(2)}`
}

function MaintenanceHubPage() {
  const { events: initialEvents, alerts } = Route.useRouteContext() as unknown as {
    events: MaintenanceEventRow[]
    alerts: MaintenanceAlertRow[]
  }

  const [filter, setFilter] = useState<EventFilter>('open')

  const filteredEvents = initialEvents.filter((e) => {
    if (filter === 'all') return true
    if (filter === 'open') return e.status === 'open'
    return e.status === 'completed'
  })

  const redAlerts = alerts.filter((a) => a.severity === 'red')
  const amberAlerts = alerts.filter((a) => a.severity === 'amber')

  return (
    <div className="maint-hub">
      <div className="maint-hub-header">
        <div>
          <p className="island-kicker mb-1">Maintenance</p>
          <h1 className="text-2xl font-semibold text-[var(--sea-ink)]">Fleet Maintenance</h1>
        </div>
      </div>

      {/* ── Alert summary ── */}
      {alerts.length > 0 && (
        <section className="workspace-panel island-shell mb-4 p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-500" />
            <p className="island-kicker">Alerts</p>
            <span className="ml-auto text-xs text-[var(--sea-ink-soft)]">{alerts.length} total</span>
          </div>
          <div className="space-y-2">
            {redAlerts.map((a, i) => (
              <Link
                key={`red-${i}`}
                to="/admin/cars/$carId"
                params={{ carId: a.carId }}
                className="hub-alert hub-alert--red text-sm"
              >
                <Wrench size={13} />
                <span className="flex-1">{a.message}</span>
                <ChevronRight size={13} className="hub-alert-arrow" />
              </Link>
            ))}
            {amberAlerts.map((a, i) => (
              <Link
                key={`amber-${i}`}
                to="/admin/cars/$carId"
                params={{ carId: a.carId }}
                className="hub-alert hub-alert--amber text-sm"
              >
                <Wrench size={13} />
                <span className="flex-1">{a.message}</span>
                <ChevronRight size={13} className="hub-alert-arrow" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Event log ── */}
      <section className="workspace-panel island-shell p-4">
        <div className="mb-4 flex items-center gap-3">
          <p className="island-kicker">Event log</p>
          <div className="ml-auto flex gap-1">
            {(['open', 'completed', 'all'] as EventFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                className={`status-tab${filter === f ? ' is-active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'open' ? 'Open' : f === 'completed' ? 'Completed' : 'All'}
              </button>
            ))}
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="hub-empty-state">
            <Wrench size={22} />
            <p>No {filter !== 'all' ? filter : ''} maintenance events.</p>
          </div>
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
            {filteredEvents.map((ev) => (
              <div key={ev.id} className="maint-event-row">
                <span className="text-xs tabular-nums text-[var(--sea-ink-soft)]">{formatDate(ev.openedAt)}</span>
                <Link
                  to="/admin/cars/$carId"
                  params={{ carId: ev.carId }}
                  className="flex items-center gap-1 font-mono text-xs font-semibold text-[var(--lagoon-deep)] hover:underline"
                >
                  <Car size={11} />
                  {ev.carPlateNumber ?? '—'}
                </Link>
                <span className="text-xs">{ev.type}</span>
                <span className="text-sm">{ev.description}</span>
                <span className="text-xs tabular-nums">{ev.costSen > 0 ? formatMYR(ev.costSen) : '—'}</span>
                <span className={`maint-status-badge maint-status-badge--${ev.status}`}>
                  {ev.status === 'open' ? 'Open' : 'Done'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
