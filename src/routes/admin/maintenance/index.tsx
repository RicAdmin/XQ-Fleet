import { useState } from 'react'

import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { AlertTriangle, Car, ChevronRight, Plus, Trash2, Wrench } from 'lucide-react'

import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { type Column, DataTable } from '#/components/ui/DataTable'
import { ConfirmActionDialog } from '#/components/ui/ConfirmActionDialog'
import { PageHeader } from '#/components/ui/PageHeader'
import { RowActionsMenu } from '#/components/ui/RowActionsMenu'
import { StatusFilterTabs } from '#/components/ui/StatusFilterTabs'
import { Button } from '#/components/ui/button'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '#/components/ui/combobox'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { getCars } from '#/lib/car-functions'
import type { MaintenanceAlertRow, MaintenanceEventRow } from '#/lib/maintenance-functions'
import {
  closeMaintenanceEvent,
  createMaintenanceEvent,
  deleteMaintenanceEvent,
  getAllMaintenanceEvents,
  getMaintenanceDashboardAlerts,
} from '#/lib/maintenance-functions'
import type { MaintenanceEventType } from '#/db/schema'

export const Route = createFileRoute('/admin/maintenance/')({
  beforeLoad: async ({ context }) => {
    const { session } = context as unknown as { session: { user: { role: string; name: string; email: string } } | null }
    if (!session) throw redirect({ to: '/internal/login' })
    const [events, alerts, carList] = await Promise.all([
      getAllMaintenanceEvents({ data: { statusFilter: 'all' } }),
      getMaintenanceDashboardAlerts(),
      getCars(),
    ])
    return { events, alerts, carList }
  },
  component: AdminMaintenancePage,
})

// ─── Types ────────────────────────────────────────────────────────────────────

type EventFilter = 'all' | 'open' | 'completed'

type CarOption = { id: string; plateNumber: string; make: string; model: string; year: number }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: Date | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatMYR(sen: number): string {
  return `RM ${(sen / 100).toFixed(2)}`
}

const EVENT_TYPE_OPTIONS: { value: MaintenanceEventType; label: string }[] = [
  { value: 'scheduled', label: 'Scheduled service' },
  { value: 'unscheduled', label: 'Unscheduled repair' },
  { value: 'damage', label: 'Damage repair' },
  { value: 'road-tax', label: 'Road tax renewal' },
  { value: 'insurance', label: 'Insurance renewal' },
]

// ─── Main component ───────────────────────────────────────────────────────────

function AdminMaintenancePage() {
  const { session, events: initialEvents, alerts: initialAlerts, carList } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
    events: MaintenanceEventRow[]
    alerts: MaintenanceAlertRow[]
    carList: CarOption[]
  }

  const isOwner = session.user.role === 'owner'

  // ── Event list state ──
  const [events, setEvents] = useState<MaintenanceEventRow[]>(initialEvents)
  const [alerts, setAlerts] = useState<MaintenanceAlertRow[]>(initialAlerts)
  const [filter, setFilter] = useState<EventFilter>('open')

  // ── Log new event sheet ──
  const [logOpen, setLogOpen] = useState(false)
  const [logCarId, setLogCarId] = useState<string>('')
  const [logType, setLogType] = useState<MaintenanceEventType>('scheduled')
  const [logDesc, setLogDesc] = useState('')
  const [logMileage, setLogMileage] = useState('')
  const [logCost, setLogCost] = useState('0.00')
  const [logVendor, setLogVendor] = useState('')
  const [logNextMileage, setLogNextMileage] = useState('')
  const [logNextDate, setLogNextDate] = useState('')
  const [logSubmitting, setLogSubmitting] = useState(false)
  const [logError, setLogError] = useState<string | null>(null)

  // ── Close event sheet ──
  const [closeSheetId, setCloseSheetId] = useState<string | null>(null)
  const [closeMileage, setCloseMileage] = useState('')
  const [closeCost, setCloseCost] = useState('0.00')
  const [closeVendor, setCloseVendor] = useState('')
  const [closeNextMileage, setCloseNextMileage] = useState('')
  const [closeNextDate, setCloseNextDate] = useState('')
  const [closeSubmitting, setCloseSubmitting] = useState(false)
  const [closeError, setCloseError] = useState<string | null>(null)

  // ── Delete confirm ──
  const [confirmDelete, setConfirmDelete] = useState<MaintenanceEventRow | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // ─── Derived ──

  const filteredEvents = events.filter((e) => {
    if (filter === 'all') return true
    if (filter === 'open') return e.status === 'open'
    return e.status === 'completed'
  })

  const openEvents = events.filter((e) => e.status === 'open')
  const totalOpenCostSen = openEvents.reduce((sum, e) => sum + e.costSen, 0)
  const totalAllCostSen = events.reduce((sum, e) => sum + e.costSen, 0)
  const redAlerts = alerts.filter((a) => a.severity === 'red')
  const amberAlerts = alerts.filter((a) => a.severity === 'amber')

  // ─── Handlers ──

  function openCloseSheet(ev: MaintenanceEventRow) {
    setCloseSheetId(ev.id)
    setCloseMileage(ev.mileageAtService ? String(ev.mileageAtService) : '')
    setCloseCost(ev.costSen > 0 ? (ev.costSen / 100).toFixed(2) : '0.00')
    setCloseVendor(ev.workshopVendor ?? '')
    setCloseNextMileage(ev.nextDueMileage ? String(ev.nextDueMileage) : '')
    setCloseNextDate(ev.nextDueDate ? new Date(ev.nextDueDate).toISOString().split('T')[0] : '')
    setCloseError(null)
  }

  async function handleClose(e: React.FormEvent) {
    e.preventDefault()
    if (!closeSheetId) return
    setCloseSubmitting(true)
    setCloseError(null)
    try {
      await closeMaintenanceEvent({
        data: {
          eventId: closeSheetId,
          mileageAtService: closeMileage ? Number(closeMileage) : null,
          costSen: closeCost ? Math.round(Number(closeCost) * 100) : undefined,
          workshopVendor: closeVendor || null,
          nextDueMileage: closeNextMileage ? Number(closeNextMileage) : null,
          nextDueDate: closeNextDate || null,
        },
      })
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === closeSheetId ? { ...ev, status: 'completed' as const, completedAt: new Date() } : ev,
        ),
      )
      setCloseSheetId(null)
    } catch (err) {
      setCloseError(err instanceof Error ? err.message : 'Failed to close event.')
    } finally {
      setCloseSubmitting(false)
    }
  }

  function resetLogForm() {
    setLogCarId('')
    setLogType('scheduled')
    setLogDesc('')
    setLogMileage('')
    setLogCost('0.00')
    setLogVendor('')
    setLogNextMileage('')
    setLogNextDate('')
    setLogError(null)
  }

  async function handleLogNewEvent(e: React.FormEvent) {
    e.preventDefault()
    if (!logCarId) { setLogError('Please select a vehicle.'); return }
    if (!logDesc.trim()) { setLogError('Description is required.'); return }
    setLogSubmitting(true)
    setLogError(null)
    try {
      await createMaintenanceEvent({
        data: {
          carId: logCarId,
          type: logType,
          description: logDesc.trim(),
          mileageAtService: logMileage ? Number(logMileage) : null,
          costSen: Math.round(Number(logCost) * 100),
          workshopVendor: logVendor || null,
          nextDueMileage: logNextMileage ? Number(logNextMileage) : null,
          nextDueDate: logNextDate || null,
        },
      })
      const [freshEvents, freshAlerts] = await Promise.all([
        getAllMaintenanceEvents({ data: { statusFilter: 'all' } }),
        getMaintenanceDashboardAlerts(),
      ])
      setEvents(freshEvents)
      setAlerts(freshAlerts)
      setLogOpen(false)
      resetLogForm()
    } catch (err) {
      setLogError(err instanceof Error ? err.message : 'Failed to log event.')
    } finally {
      setLogSubmitting(false)
    }
  }

  async function handleDelete(event: MaintenanceEventRow) {
    setDeletingId(event.id)
    setDeleteError(null)
    try {
      await deleteMaintenanceEvent({ data: { eventId: event.id } })
      setEvents((prev) => prev.filter((e) => e.id !== event.id))
      setConfirmDelete(null)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete event.')
    } finally {
      setDeletingId(null)
    }
  }

  const closeSheetEvent = closeSheetId ? events.find((e) => e.id === closeSheetId) : null

  // ── Table columns ──

  const eventColumns: Column<MaintenanceEventRow>[] = [
    {
      key: 'openedAt',
      header: 'Date',
      cellClassName: 'text-xs tabular-nums text-[var(--sea-ink-soft)]',
      render: (ev) => formatDate(ev.openedAt),
    },
    {
      key: 'carPlateNumber',
      header: 'Vehicle',
      render: (ev) => (
        <Link
          to="/admin/cars/$carId"
          params={{ carId: ev.carId }}
          className="flex items-center gap-1 font-mono text-xs font-semibold text-[var(--lagoon-deep)] hover:underline"
        >
          <Car size={11} />
          {ev.carPlateNumber ?? '—'}
        </Link>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      cellClassName: 'text-xs capitalize',
      render: (ev) => ev.type,
    },
    {
      key: 'description',
      header: 'Description',
      cellClassName: 'text-sm',
      render: (ev) => ev.description,
    },
    {
      key: 'costSen',
      header: 'Cost',
      cellClassName: 'text-xs tabular-nums',
      render: (ev) => (ev.costSen > 0 ? formatMYR(ev.costSen) : '—'),
    },
    {
      key: 'status',
      header: 'Status',
      render: (ev) => (
        <span className={`maint-status-badge maint-status-badge--${ev.status}`}>
          {ev.status === 'open' ? 'Open' : 'Done'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      cellClassName: 'text-right whitespace-nowrap',
      render: (ev) => (
        <RowActionsMenu
          label={`Actions for ${ev.carPlateNumber ?? 'event'}`}
          actions={[
            ...(ev.status === 'open'
              ? [{ label: 'Close event', onSelect: () => openCloseSheet(ev) }]
              : []),
            ...(isOwner
              ? [
                  {
                    label: 'Delete',
                    icon: <Trash2 />,
                    variant: 'destructive' as const,
                    separatorBefore: ev.status === 'open',
                    disabled: deletingId === ev.id,
                    onSelect: () => {
                      setDeleteError(null)
                      setConfirmDelete(ev)
                    },
                  },
                ]
              : []),
          ]}
        />
      ),
    },
  ]

  // ─── Render ──

  return (
    <AdminSidebarShell user={session.user} pageTitle="Maintenance">
      <PageHeader
        kicker="Fleet maintenance"
        title="Fleet Maintenance"
        description={`${openEvents.length} open event${openEvents.length !== 1 ? 's' : ''} · ${events.length} total`}
        actions={
          <Button size="sm" onClick={() => { resetLogForm(); setLogOpen(true) }}>
            <Plus size={14} />
            Log event
          </Button>
        }
      />

      {/* ── Summary stats ── */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Open events" value={String(openEvents.length)} accent={openEvents.length > 0} />
        <StatCard label="Open cost" value={totalOpenCostSen > 0 ? formatMYR(totalOpenCostSen) : '—'} />
        <StatCard label="Completed" value={String(events.length - openEvents.length)} />
        <StatCard label="Total cost logged" value={totalAllCostSen > 0 ? formatMYR(totalAllCostSen) : '—'} />
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
      <StatusFilterTabs
        className="mb-4"
        aria-label="Filter maintenance events by status"
        value={filter}
        onValueChange={setFilter}
        tabs={[
          { value: 'open', label: 'Open', count: openEvents.length },
          { value: 'completed', label: 'Completed', count: events.length - openEvents.length },
          { value: 'all', label: 'All', count: events.length },
        ]}
      />

      <article className="workspace-panel island-shell overflow-x-auto p-0">
        <DataTable
          columns={eventColumns}
          data={filteredEvents}
          getKey={(ev) => ev.id}
          emptyState={
            <div className="hub-empty-state">
              <Wrench size={22} />
              <p>No {filter !== 'all' ? filter : ''} maintenance events.</p>
            </div>
          }
        />
      </article>

      {/* ── Log new event sheet ── */}
      <Sheet open={logOpen} onOpenChange={setLogOpen}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Log maintenance event</SheetTitle>
            <SheetDescription>Record a new maintenance or repair event for a vehicle.</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleLogNewEvent} className="flex flex-1 flex-col gap-4 px-4">
            {/* Vehicle picker */}
            <div className="form-field">
              <label className="field-label">Vehicle *</label>
              <Combobox value={logCarId} onValueChange={(v) => setLogCarId(v as string)}>
                <ComboboxInput
                  className="w-full"
                  placeholder="Search plate, make, model…"
                  showClear={!!logCarId}
                />
                <ComboboxContent>
                  <ComboboxList>
                    <ComboboxEmpty>No vehicles found</ComboboxEmpty>
                    {carList.map((car) => (
                      <ComboboxItem key={car.id} value={car.id}>
                        <span className="font-mono text-xs font-semibold">{car.plateNumber}</span>
                        <span className="text-muted-foreground ml-2 text-xs">
                          {car.year} {car.make} {car.model}
                        </span>
                      </ComboboxItem>
                    ))}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>

            {/* Type */}
            <div className="form-field">
              <label className="field-label" htmlFor="log-type">Type *</label>
              <select
                id="log-type"
                className="form-input"
                value={logType}
                onChange={(e) => setLogType(e.target.value as MaintenanceEventType)}
              >
                {EVENT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="form-field">
              <label className="field-label" htmlFor="log-desc">Description *</label>
              <input
                id="log-desc"
                className="form-input"
                type="text"
                placeholder="e.g. Full service, oil + filter change"
                value={logDesc}
                onChange={(e) => setLogDesc(e.target.value)}
                required
              />
            </div>

            {/* Mileage + Cost row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="form-field">
                <label className="field-label" htmlFor="log-mileage">Mileage (km)</label>
                <input
                  id="log-mileage"
                  className="form-input"
                  type="number"
                  min="0"
                  placeholder="e.g. 45000"
                  value={logMileage}
                  onChange={(e) => setLogMileage(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label className="field-label" htmlFor="log-cost">Cost (RM)</label>
                <input
                  id="log-cost"
                  className="form-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={logCost}
                  onChange={(e) => setLogCost(e.target.value)}
                />
              </div>
            </div>

            {/* Workshop */}
            <div className="form-field">
              <label className="field-label" htmlFor="log-vendor">Workshop / vendor</label>
              <input
                id="log-vendor"
                className="form-input"
                type="text"
                placeholder="e.g. Ah Kow Auto Sdn Bhd"
                value={logVendor}
                onChange={(e) => setLogVendor(e.target.value)}
              />
            </div>

            {/* Next due */}
            <div className="grid grid-cols-2 gap-3">
              <div className="form-field">
                <label className="field-label" htmlFor="log-next-mileage">Next due (km)</label>
                <input
                  id="log-next-mileage"
                  className="form-input"
                  type="number"
                  min="0"
                  placeholder="e.g. 50000"
                  value={logNextMileage}
                  onChange={(e) => setLogNextMileage(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label className="field-label" htmlFor="log-next-date">Next due (date)</label>
                <input
                  id="log-next-date"
                  className="form-input"
                  type="date"
                  value={logNextDate}
                  onChange={(e) => setLogNextDate(e.target.value)}
                />
              </div>
            </div>

            {logError && <p className="form-error">{logError}</p>}

            <SheetFooter className="px-0">
              <Button type="submit" disabled={logSubmitting}>
                {logSubmitting ? 'Saving…' : 'Log event'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setLogOpen(false)}>
                Cancel
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Close event sheet ── */}
      <Sheet
        open={!!closeSheetId}
        onOpenChange={(open) => { if (!open) setCloseSheetId(null) }}
      >
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Close maintenance event</SheetTitle>
            {closeSheetEvent && (
              <SheetDescription>
                <span className="font-mono font-semibold">{closeSheetEvent.carPlateNumber ?? '—'}</span>
                {' · '}{closeSheetEvent.description}
              </SheetDescription>
            )}
          </SheetHeader>

          <form onSubmit={handleClose} className="flex flex-1 flex-col gap-4 px-4">
            {/* Mileage + Cost */}
            <div className="grid grid-cols-2 gap-3">
              <div className="form-field">
                <label className="field-label" htmlFor="close-mileage">Mileage at service (km)</label>
                <input
                  id="close-mileage"
                  className="form-input"
                  type="number"
                  min="0"
                  placeholder="e.g. 45000"
                  value={closeMileage}
                  onChange={(e) => setCloseMileage(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label className="field-label" htmlFor="close-cost">Final cost (RM)</label>
                <input
                  id="close-cost"
                  className="form-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={closeCost}
                  onChange={(e) => setCloseCost(e.target.value)}
                />
              </div>
            </div>

            {/* Workshop */}
            <div className="form-field">
              <label className="field-label" htmlFor="close-vendor">Workshop / vendor</label>
              <input
                id="close-vendor"
                className="form-input"
                type="text"
                placeholder="e.g. Ah Kow Auto Sdn Bhd"
                value={closeVendor}
                onChange={(e) => setCloseVendor(e.target.value)}
              />
            </div>

            {/* Next due */}
            <div className="grid grid-cols-2 gap-3">
              <div className="form-field">
                <label className="field-label" htmlFor="close-next-mileage">Next due (km)</label>
                <input
                  id="close-next-mileage"
                  className="form-input"
                  type="number"
                  min="0"
                  placeholder="e.g. 50000"
                  value={closeNextMileage}
                  onChange={(e) => setCloseNextMileage(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label className="field-label" htmlFor="close-next-date">Next due (date)</label>
                <input
                  id="close-next-date"
                  className="form-input"
                  type="date"
                  value={closeNextDate}
                  onChange={(e) => setCloseNextDate(e.target.value)}
                />
              </div>
            </div>

            {closeError && <p className="form-error">{closeError}</p>}

            <SheetFooter className="px-0">
              <Button type="submit" disabled={closeSubmitting}>
                {closeSubmitting ? 'Saving…' : 'Mark completed'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setCloseSheetId(null)}>
                Cancel
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Delete confirm dialog ── */}
      <ConfirmActionDialog
        open={confirmDelete != null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDelete(null)
            setDeleteError(null)
          }
        }}
        title="Delete this maintenance record?"
        description={
          confirmDelete ? (
            <>
              <span className="font-medium text-[var(--sea-ink)]">{confirmDelete.carPlateNumber ?? 'Vehicle'}</span>
              {' · '}{confirmDelete.type}{' · '}{formatDate(confirmDelete.openedAt)}
              <br />
              This action cannot be undone.
              {confirmDelete.status === 'open' && ' If no other open events remain, the vehicle will be set back to Available.'}
              {deleteError ? (
                <span className="mt-2 block text-[var(--error)]">{deleteError}</span>
              ) : null}
            </>
          ) : null
        }
        confirmLabel="Delete"
        confirming={confirmDelete != null && deletingId === confirmDelete.id}
        onConfirm={() => {
          if (confirmDelete) return handleDelete(confirmDelete)
        }}
      />
    </AdminSidebarShell>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="island-shell rounded-xl p-3">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[var(--sea-ink-soft)]">{label}</p>
      <p
        className="text-xl font-bold leading-none tabular-nums"
        style={{ color: accent ? 'var(--error)' : 'var(--sea-ink)' }}
      >
        {value}
      </p>
    </div>
  )
}
