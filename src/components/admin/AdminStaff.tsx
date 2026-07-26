import { useEffect, useMemo, useState } from 'react'

import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { type Column, DataTable } from '#/components/ui/DataTable'
import { ErrorPanel } from '#/components/ui/ErrorPanel'
import { PageHeader } from '#/components/ui/PageHeader'
import { Button } from '#/components/ui/button'
import { createStaffInvitation } from '#/lib/auth-functions'
import { getStaffProfileLabel, staffProfiles, type StaffProfile } from '#/lib/auth-model'
import {
  listPendingStaffInvitations,
  listStaffUsers,
  updateStaffProfile,
  type StaffUserRow,
} from '#/lib/staff-admin-functions'

type AdminStaffProps = {
  session: { user: { name: string; email: string; role: string } }
}

export default function AdminStaff({ session }: AdminStaffProps) {
  const [users, setUsers] = useState<StaffUserRow[]>([])
  const [invites, setInvites] = useState<
    Awaited<ReturnType<typeof listPendingStaffInvitations>>
  >([])
  const [email, setEmail] = useState('')
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [staffUsers, pendingInvites] = await Promise.all([
        listStaffUsers(),
        listPendingStaffInvitations(),
      ])
      setUsers(staffUsers)
      setInvites(pendingInvites)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load staff.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setError(null)
    try {
      const invitation = await createStaffInvitation({ data: { email } })
      setInviteUrl(invitation.inviteUrl)
      setEmail('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invitation.')
    } finally {
      setInviting(false)
    }
  }

  async function handleProfileChange(userId: string, staffProfile: StaffProfile) {
    await updateStaffProfile({ data: { userId, staffProfile } })
    await load()
  }

  const columns = useMemo<Column<StaffUserRow>[]>(
    () => [
      { key: 'name', header: 'Name', render: (row) => row.name },
      { key: 'email', header: 'Email', render: (row) => row.email },
      { key: 'role', header: 'Role', render: (row) => row.role },
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
        header: 'Active',
        render: (row) => (row.isActive ? 'Yes' : 'No'),
      },
    ],
    [],
  )

  return (
    <AdminSidebarShell user={session.user} pageTitle="Staff">
      <PageHeader
        title="Staff"
        description="Invite staff and assign Customer Service or Operations desk access."
      />

      {error ? <ErrorPanel title="Staff admin error" message={error} onRetry={load} /> : null}

      <article className="workspace-panel island-shell space-y-4 p-4">
        <form className="flex flex-wrap items-end gap-3" onSubmit={handleInvite}>
          <div className="min-w-[16rem] flex-1">
            <label className="field-label" htmlFor="staff-email">
              Invite email
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
          <Button type="submit" disabled={inviting}>
            {inviting ? 'Sending…' : 'Send invitation'}
          </Button>
        </form>
        {inviteUrl ? (
          <p className="text-sm text-[var(--sea-ink-soft)]">
            Invitation link:{' '}
            <a href={inviteUrl} className="font-semibold text-[var(--lagoon-deep)]">
              {inviteUrl}
            </a>
          </p>
        ) : null}
      </article>

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

      {invites.length > 0 ? (
        <article className="workspace-panel island-shell space-y-2 p-4">
          <h2 className="text-sm font-semibold text-[var(--sea-ink-soft)]">
            Pending invitations
          </h2>
          <ul className="space-y-1 text-sm">
            {invites.map((invite) => (
              <li key={invite.id}>
                {invite.email} · expires {invite.expiresAt.toLocaleString()}
              </li>
            ))}
          </ul>
        </article>
      ) : null}
    </AdminSidebarShell>
  )
}
