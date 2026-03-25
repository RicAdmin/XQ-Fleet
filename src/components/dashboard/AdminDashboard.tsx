import { useMemo, useState } from 'react'

import { Link } from '@tanstack/react-router'
import { AlertTriangle, CalendarCheck, Car, TrendingUp, Wrench } from 'lucide-react'

import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import {
  createStaffInvitation,
  deactivateStaffAccount,
} from '#/lib/auth-functions'
import type { DashboardData, FleetCounts, OwnerStats } from '#/lib/dashboard-functions'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMYR(sen: number): string {
  return `RM ${(sen / 100).toFixed(2)}`
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Owner stat card ──────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent: string
}) {
  return (
    <div
      className="island-shell workspace-panel flex items-start gap-4 p-5"
      style={{ borderTop: `3px solid ${accent}` }}
    >
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${accent}18`, color: accent }}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
          {label}
        </p>
        <p className="mt-0.5 text-2xl font-bold text-[var(--sea-ink)]">{value}</p>
      </div>
    </div>
  )
}

// ─── Fleet status pill ────────────────────────────────────────────────────────

const STATUS_META: {
  key: keyof FleetCounts
  label: string
  dotColor: string
  bg: string
  border: string
}[] = [
  { key: 'available', label: 'Available', dotColor: '#3aab6a', bg: '#f0faf4', border: '#bbedd0' },
  { key: 'rented', label: 'Rented', dotColor: 'var(--lagoon)', bg: '#f0f9fa', border: '#b3e4e8' },
  { key: 'reserved', label: 'Reserved', dotColor: '#7c5cbf', bg: '#f5f3fc', border: '#cfc4ed' },
  { key: 'maintenance', label: 'Maintenance', dotColor: '#e8a030', bg: '#fdf7ed', border: '#f3d7a0' },
  { key: 'damaged', label: 'Damaged', dotColor: '#d44444', bg: '#fdf1f1', border: '#f5c5c5' },
  { key: 'retired', label: 'Retired', dotColor: '#9aaa9a', bg: '#f5f5f4', border: '#d5d9d5' },
]

function FleetPill({
  label,
  count,
  dotColor,
  bg,
  border,
}: {
  label: string
  count: number
  dotColor: string
  bg: string
  border: string
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-full border px-3 py-1.5"
      style={{ background: bg, borderColor: border }}
    >
      <span
        className="inline-block size-2.5 rounded-full shrink-0"
        style={{ background: dotColor }}
      />
      <span className="text-sm font-semibold text-[var(--sea-ink)]">{count}</span>
      <span className="text-xs text-[var(--sea-ink-soft)]">{label}</span>
    </div>
  )
}

// ─── Rental alert rows ────────────────────────────────────────────────────────

type RentalAlertRowProps = {
  id: string
  carPlateNumber: string | null
  carMake: string | null
  carModel: string | null
  customerFullName: string | null
  endDate: Date
  daysOverdue?: number
}

function RentalAlertRow({ id, carPlateNumber, carMake, carModel, customerFullName, endDate, daysOverdue }: RentalAlertRowProps) {
  return (
    <Link
      to="/admin/rentals/$rentalId"
      params={{ rentalId: id }}
      className="list-row hover:bg-[var(--chip-bg)] transition-colors"
    >
      <div>
        <p className="m-0 font-semibold text-[var(--sea-ink)]">
          <span className="font-mono">{carPlateNumber ?? '—'}</span>
          <span className="ml-2 text-sm font-normal text-[var(--sea-ink-soft)]">
            {carMake} {carModel}
          </span>
        </p>
        <p className="m-0 text-sm text-[var(--sea-ink-soft)]">{customerFullName ?? '—'}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-[var(--sea-ink-soft)]">{formatDate(endDate)}</span>
        {daysOverdue != null && (
          <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
            +{daysOverdue}d overdue
          </span>
        )}
      </div>
    </Link>
  )
}

// ─── Shared types ─────────────────────────────────────────────────────────────

type StaffRow = {
  id: string
  name: string
  email: string
  createdAt: Date
  status: 'active' | 'deactivated'
}

type InvitationRow = {
  id: string
  email: string
  createdAt: Date
  expiresAt: Date
}

type StaffDirectory = {
  staffUsers: StaffRow[]
  pendingInvitations: InvitationRow[]
}

// ─── Props ────────────────────────────────────────────────────────────────────

type AdminDashboardProps = {
  session: { user: { name: string; email: string; role: string } }
  data: DashboardData
  ownerStats: OwnerStats
  directory: StaffDirectory
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminDashboard({ session, data, ownerStats, directory }: AdminDashboardProps) {
  const { fleetCounts, dueToday, overdue, maintenanceAlerts } = data

  // Staff management state
  const [email, setEmail] = useState('')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [successUrl, setSuccessUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  const [staffMembers, setStaffMembers] = useState<StaffRow[]>(directory.staffUsers)
  const [pendingInvitations, setPendingInvitations] = useState<InvitationRow[]>(directory.pendingInvitations)
  const [deactivateError, setDeactivateError] = useState<string | null>(null)

  const activeStaffCount = useMemo(
    () => staffMembers.filter((m) => m.status === 'active').length,
    [staffMembers],
  )

  const totalCars = Object.values(fleetCounts).reduce((a, b) => a + b, 0)

  return (
    <AdminSidebarShell user={session.user} pageTitle="Dashboard">

      {/* ── Owner stat cards ── */}
      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Revenue today"
          value={formatMYR(ownerStats.revenueTodaySen)}
          accent="var(--lagoon-deep)"
        />
        <StatCard
          icon={<Car size={18} />}
          label="Active rentals"
          value={String(ownerStats.activeRentalsCount)}
          accent="#7c5cbf"
        />
        <StatCard
          icon={<CalendarCheck size={18} />}
          label="Bookings this week"
          value={String(ownerStats.bookingsThisWeek)}
          accent="#e8a030"
        />
      </section>

      {/* ── Fleet summary ── */}
      <section className="workspace-panel island-shell mb-6 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="island-kicker mb-0.5">Fleet</p>
            <h2 className="text-xl font-semibold text-[var(--sea-ink)]">
              {totalCars} car{totalCars !== 1 ? 's' : ''} total
            </h2>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_META.map(({ key, label, dotColor, bg, border }) => (
            <FleetPill
              key={key}
              label={label}
              count={fleetCounts[key]}
              dotColor={dotColor}
              bg={bg}
              border={border}
            />
          ))}
        </div>
      </section>

      {/* ── Due today + Overdue + Maintenance ── */}
      <section className="mb-6 grid gap-4 lg:grid-cols-3">
        {/* Due today */}
        <article className="workspace-panel island-shell p-5">
          <div className="mb-4 flex items-center gap-2">
            <CalendarCheck size={16} className="text-amber-500" />
            <p className="island-kicker">Due back today</p>
            {dueToday.length > 0 && (
              <span className="ml-auto inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                {dueToday.length}
              </span>
            )}
          </div>
          {dueToday.length === 0 ? (
            <p className="text-sm text-[var(--sea-ink-soft)]">No returns due today.</p>
          ) : (
            <div className="space-y-2">
              {dueToday.map((r) => (
                <RentalAlertRow key={r.id} {...r} />
              ))}
            </div>
          )}
        </article>

        {/* Overdue */}
        <article className="workspace-panel island-shell p-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            <p className="island-kicker">Overdue</p>
            {overdue.length > 0 && (
              <span className="ml-auto inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                {overdue.length}
              </span>
            )}
          </div>
          {overdue.length === 0 ? (
            <p className="text-sm text-[var(--sea-ink-soft)]">No overdue rentals.</p>
          ) : (
            <div className="space-y-2">
              {overdue.map((r) => (
                <RentalAlertRow key={r.id} {...r} daysOverdue={r.daysOverdue} />
              ))}
            </div>
          )}
        </article>

        {/* Maintenance alerts */}
        <article className="workspace-panel island-shell p-5">
          <div className="mb-4 flex items-center gap-2">
            <Wrench size={16} className="text-amber-600" />
            <p className="island-kicker">Maintenance</p>
            {maintenanceAlerts.length > 0 && (
              <span className="ml-auto inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                {maintenanceAlerts.length}
              </span>
            )}
          </div>
          {maintenanceAlerts.length === 0 ? (
            <p className="text-sm text-[var(--sea-ink-soft)]">No maintenance alerts.</p>
          ) : (
            <div className="space-y-2">
              {maintenanceAlerts.slice(0, 5).map((a, i) => (
                <Link
                  key={i}
                  to="/app/maintenance"
                  className={`hub-alert hub-alert--${a.severity} text-xs`}
                >
                  <Wrench size={12} />
                  <span className="flex-1 truncate">{a.message}</span>
                </Link>
              ))}
              {maintenanceAlerts.length > 5 && (
                <Link to="/app/maintenance" className="text-xs font-medium text-[var(--lagoon-deep)] hover:underline">
                  +{maintenanceAlerts.length - 5} more →
                </Link>
              )}
            </div>
          )}
        </article>
      </section>

      {/* ── Staff management ── */}
      <section className="mb-2">
        <p className="island-kicker mb-4">Staff management</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="workspace-panel island-shell">
          <p className="island-kicker mb-2">Invite staff</p>
          <h2 className="text-2xl font-semibold text-[var(--sea-ink)]">Create a staff invitation</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--sea-ink-soft)]">
            Stage 1 uses a stored invite link instead of outbound email delivery. Create the invite here, then copy and share the acceptance URL manually.
          </p>

          <form
            className="mt-6 space-y-4"
            onSubmit={async (event) => {
              event.preventDefault()
              setInviteError(null)
              setSuccessUrl(null)
              setIsSubmitting(true)
              try {
                const invitation = await createStaffInvitation({ data: { email } })
                setPendingInvitations((current) => [
                  { id: invitation.inviteUrl, email: invitation.email, createdAt: new Date(), expiresAt: invitation.expiresAt },
                  ...current,
                ])
                setSuccessUrl(invitation.inviteUrl)
                setEmail('')
              } catch (err) {
                setInviteError(err instanceof Error ? err.message : 'Unable to create that invite.')
              } finally {
                setIsSubmitting(false)
              }
            }}
          >
            <div>
              <label className="field-label" htmlFor="staff-email">Staff email</label>
              <input
                id="staff-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field-input"
                required
              />
            </div>
            {inviteError && <p className="form-error">{inviteError}</p>}
            <button type="submit" className="button-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating invite…' : 'Generate invite link'}
            </button>
          </form>

          {successUrl && (
            <div className="auth-note mt-6 rounded-3xl border border-[var(--line)] bg-[rgba(255,255,255,0.45)] p-5">
              <p className="island-kicker mb-2">Ready to share</p>
              <p className="mb-3 text-sm leading-7 text-[var(--sea-ink-soft)]">
                Copy this acceptance link and send it to the staff member.
              </p>
              <input className="field-input" readOnly value={successUrl} />
              <div className="mt-3">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={async () => {
                    setIsCopying(true)
                    try { await navigator.clipboard.writeText(successUrl) }
                    finally { setIsCopying(false) }
                  }}
                >
                  {isCopying ? 'Copying…' : 'Copy link'}
                </button>
              </div>
            </div>
          )}
        </article>

        <article className="workspace-panel island-shell">
          <p className="island-kicker mb-2">Access summary</p>
          <div className="space-y-4">
            <div className="summary-row">
              <span>Active staff</span>
              <strong>{activeStaffCount}</strong>
            </div>
            <div className="summary-row">
              <span>Pending invites</span>
              <strong>{pendingInvitations.length}</strong>
            </div>
            <div className="summary-row">
              <span>Session role</span>
              <strong>Owner</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="workspace-panel island-shell">
          <p className="island-kicker mb-2">Staff directory</p>
          <h2 className="text-xl font-semibold text-[var(--sea-ink)]">Manage active staff</h2>
          {deactivateError && <p className="form-error mt-3">{deactivateError}</p>}
          <div className="mt-5 space-y-3">
            {staffMembers.length === 0 ? (
              <p className="m-0 text-sm text-[var(--sea-ink-soft)]">No staff accounts have been activated yet.</p>
            ) : (
              staffMembers.map((member) => (
                <div key={member.id} className="list-row">
                  <div>
                    <p className="m-0 font-semibold text-[var(--sea-ink)]">{member.name}</p>
                    <p className="m-0 text-sm text-[var(--sea-ink-soft)]">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`role-pill ${member.status === 'deactivated' ? 'opacity-70' : ''}`}>
                      {member.status}
                    </span>
                    {member.status === 'active' && (
                      <button
                        type="button"
                        className="button-secondary"
                        onClick={async () => {
                          try {
                            await deactivateStaffAccount({ data: { userId: member.id } })
                            setStaffMembers((current) =>
                              current.map((row) => row.id === member.id ? { ...row, status: 'deactivated' } : row),
                            )
                          } catch (err) {
                            setDeactivateError(err instanceof Error ? err.message : 'Unable to deactivate that account.')
                          }
                        }}
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="workspace-panel island-shell">
          <p className="island-kicker mb-2">Pending invitations</p>
          <h2 className="text-xl font-semibold text-[var(--sea-ink)]">Outstanding links</h2>
          <div className="mt-5 space-y-3">
            {pendingInvitations.length === 0 ? (
              <p className="m-0 text-sm text-[var(--sea-ink-soft)]">No pending invitations right now.</p>
            ) : (
              pendingInvitations.map((invite) => (
                <div key={invite.id} className="list-row">
                  <div>
                    <p className="m-0 font-semibold text-[var(--sea-ink)]">{invite.email}</p>
                    <p className="m-0 text-sm text-[var(--sea-ink-soft)]">Expires {invite.expiresAt.toLocaleString()}</p>
                  </div>
                  <span className="role-pill">pending</span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </AdminSidebarShell>
  )
}
