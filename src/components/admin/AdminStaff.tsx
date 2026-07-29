import { useEffect, useMemo, useState } from 'react'

import { Copy, KeyRound, UserCheck, UserX, X } from 'lucide-react'

import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { showAdminToast } from '#/components/ui/AdminToast'
import { type Column, DataTable } from '#/components/ui/DataTable'
import { ErrorPanel } from '#/components/ui/ErrorPanel'
import { PageHeader } from '#/components/ui/PageHeader'
import { Button } from '#/components/ui/button'
import { getStaffProfileLabel, staffProfiles, type StaffProfile } from '#/lib/auth-model'
import {
  createStaffAccount,
  listStaffUsers,
  regenerateStaffPassword,
  setStaffActive,
  updateStaffProfile,
  type StaffUserRow,
} from '#/lib/staff-admin-functions'

type AdminStaffProps = {
  session: { user: { name: string; email: string; role: string } }
}

function roleLabel(role: string): string {
  if (role === 'super_admin') return 'Super admin'
  return role.charAt(0).toUpperCase() + role.slice(1)
}

export default function AdminStaff({ session }: AdminStaffProps) {
  const [users, setUsers] = useState<StaffUserRow[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [createProfile, setCreateProfile] = useState<StaffProfile>('customer_service')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [busyUserId, setBusyUserId] = useState<string | null>(null)
  const [tempPassword, setTempPassword] = useState<{
    email: string
    password: string
  } | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const staffUsers = await listStaffUsers()
      setUsers(staffUsers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load staff.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
      showAdminToast(`${label} copied.`)
    } catch {
      showAdminToast('Copy failed — select and copy manually.')
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError(null)
    try {
      const result = await createStaffAccount({
        data: {
          name,
          email,
          staffProfile: createProfile,
          ...(password.trim() ? { password } : {}),
        },
      })
      if (result.tempPassword) {
        setTempPassword({ email: result.email, password: result.tempPassword })
      } else {
        showAdminToast(`Account created for ${result.email}.`)
      }
      setName('')
      setEmail('')
      setPassword('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account.')
    } finally {
      setCreating(false)
    }
  }

  async function handleProfileChange(userId: string, staffProfile: StaffProfile) {
    await updateStaffProfile({ data: { userId, staffProfile } })
    await load()
  }

  async function handleToggleActive(row: StaffUserRow) {
    setBusyUserId(row.id)
    setError(null)
    try {
      await setStaffActive({ data: { userId: row.id, isActive: !row.isActive } })
      showAdminToast(
        row.isActive
          ? `${row.name} deactivated — signed out everywhere.`
          : `${row.name} reactivated.`,
      )
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update account.')
    } finally {
      setBusyUserId(null)
    }
  }

  async function handleResetPassword(row: StaffUserRow) {
    if (
      !window.confirm(
        `Regenerate the password for ${row.name} (${row.email})? They will be signed out and must use the new temporary password.`,
      )
    ) {
      return
    }
    setBusyUserId(row.id)
    setError(null)
    try {
      const result = await regenerateStaffPassword({ data: { userId: row.id } })
      setTempPassword({ email: row.email, password: result.tempPassword })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password.')
    } finally {
      setBusyUserId(null)
    }
  }

  const columns = useMemo<Column<StaffUserRow>[]>(
    () => [
      { key: 'name', header: 'Name', render: (row) => row.name },
      { key: 'email', header: 'Email', render: (row) => row.email },
      {
        key: 'role',
        header: 'Role',
        render: (row) => <span className="staff-role-chip">{roleLabel(row.role)}</span>,
      },
      {
        key: 'profile',
        header: 'Desk',
        render: (row) =>
          row.role === 'staff' ? (
            <select
              className="field-input py-1 text-sm"
              value={row.staffProfile ?? 'customer_service'}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) =>
                void handleProfileChange(row.id, e.target.value as StaffProfile)
              }
            >
              {staffProfiles.map((profile) => (
                <option key={profile} value={profile}>
                  {getStaffProfileLabel(profile)}
                </option>
              ))}
            </select>
          ) : (
            '—'
          ),
      },
      {
        key: 'active',
        header: 'Status',
        render: (row) => (
          <span
            className={
              row.isActive ? 'staff-status staff-status--active' : 'staff-status staff-status--off'
            }
          >
            {row.isActive ? 'Active' : 'Deactivated'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) =>
          row.role === 'staff' ? (
            <div className="staff-row-actions" onClick={(e) => e.stopPropagation()}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busyUserId === row.id}
                onClick={() => void handleResetPassword(row)}
              >
                <KeyRound size={13} /> Reset password
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busyUserId === row.id}
                onClick={() => void handleToggleActive(row)}
              >
                {row.isActive ? (
                  <>
                    <UserX size={13} /> Deactivate
                  </>
                ) : (
                  <>
                    <UserCheck size={13} /> Reactivate
                  </>
                )}
              </Button>
            </div>
          ) : (
            '—'
          ),
      },
    ],
    [busyUserId],
  )

  return (
    <AdminSidebarShell user={session.user} pageTitle="Staff">
      <PageHeader
        title="Staff"
        description="Create staff accounts, assign their desk, and manage access."
      />

      {error ? <ErrorPanel title="Staff admin error" message={error} onRetry={load} /> : null}

      <article className="workspace-panel island-shell space-y-4 p-4">
        <form className="flex flex-wrap items-end gap-3" onSubmit={handleCreate}>
          <div className="min-w-[12rem] flex-1">
            <label className="field-label" htmlFor="staff-name">
              Full name
            </label>
            <input
              id="staff-name"
              type="text"
              className="field-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="min-w-[14rem] flex-1">
            <label className="field-label" htmlFor="staff-email">
              Email
            </label>
            <input
              id="staff-email"
              type="email"
              className="field-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="staff-desk">
              Desk
            </label>
            <select
              id="staff-desk"
              className="field-input"
              value={createProfile}
              onChange={(e) => setCreateProfile(e.target.value as StaffProfile)}
            >
              {staffProfiles.map((profile) => (
                <option key={profile} value={profile}>
                  {getStaffProfileLabel(profile)}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[12rem]">
            <label className="field-label" htmlFor="staff-password">
              Password
            </label>
            <input
              id="staff-password"
              type="text"
              className="field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Blank = auto-generate"
              minLength={8}
            />
          </div>
          <Button type="submit" disabled={creating}>
            {creating ? 'Creating…' : 'Create account'}
          </Button>
        </form>
      </article>

      {tempPassword ? (
        <article className="workspace-panel island-shell staff-temp-pass space-y-2 p-4">
          <p className="staff-temp-pass__title">New temporary password</p>
          <p className="text-sm text-[var(--sea-ink-soft)]">
            For <strong>{tempPassword.email}</strong> — shown once. They can sign in at
            /internal/login and should change it afterwards.
          </p>
          <div className="staff-invite-result__row">
            <code className="staff-invite-result__url">{tempPassword.password}</code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void copyText(tempPassword.password, 'Temporary password')}
            >
              <Copy size={13} /> Copy
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Dismiss"
              onClick={() => setTempPassword(null)}
            >
              <X size={14} />
            </Button>
          </div>
        </article>
      ) : null}

      <article className="workspace-panel island-shell overflow-x-auto p-0">
        <DataTable
          columns={columns}
          data={users}
          getKey={(row) => row.id}
          emptyState={
            <div className="p-6 text-center text-sm text-muted-foreground">
              {loading ? 'Loading…' : 'No staff accounts yet.'}
            </div>
          }
        />
      </article>
    </AdminSidebarShell>
  )
}
