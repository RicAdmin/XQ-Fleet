import { useMemo, useState } from 'react'

import { createFileRoute, redirect } from '@tanstack/react-router'

import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import {
  createStaffInvitation,
  deactivateStaffAccount,
  getStaffDirectory,
} from '#/lib/auth-functions'

export const Route = createFileRoute('/admin/')({
  beforeLoad: async ({ context }) => {
    const { session } = context as unknown as { session: { user: { role: string; name: string; email: string } } }
    if (session.user.role !== 'owner') {
      throw redirect({ to: '/admin/cars' })
    }
    const directory = await getStaffDirectory()
    return { directory }
  },
  component: AdminIndexPage,
})

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

function AdminIndexPage() {
  const { session, directory } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
    directory: { staffUsers: StaffRow[]; pendingInvitations: InvitationRow[] }
  }
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successUrl, setSuccessUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  const [staffMembers, setStaffMembers] = useState<StaffRow[]>(directory.staffUsers)
  const [pendingInvitations, setPendingInvitations] = useState<InvitationRow[]>(
    directory.pendingInvitations,
  )

  const activeStaffCount = useMemo(
    () => staffMembers.filter((member) => member.status === 'active').length,
    [staffMembers],
  )

  return (
    <AdminSidebarShell user={session.user} pageTitle="Staff management">
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
              setError(null)
              setSuccessUrl(null)
              setIsSubmitting(true)

              try {
                const invitation = await createStaffInvitation({ data: { email } })
                setPendingInvitations((current) => [
                  {
                    id: invitation.inviteUrl,
                    email: invitation.email,
                    createdAt: new Date(),
                    expiresAt: invitation.expiresAt,
                  },
                  ...current,
                ])
                setSuccessUrl(invitation.inviteUrl)
                setEmail('')
              } catch (submissionError) {
                setError(
                  submissionError instanceof Error
                    ? submissionError.message
                    : 'Unable to create that invite.',
                )
              } finally {
                setIsSubmitting(false)
              }
            }}
          >
            <div>
              <label className="field-label" htmlFor="staff-email">
                Staff email
              </label>
              <input
                id="staff-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="field-input"
                required
              />
            </div>
            {error ? <p className="form-error">{error}</p> : null}
            <button type="submit" className="button-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating invite…' : 'Generate invite link'}
            </button>
          </form>

          {successUrl ? (
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
                    try {
                      await navigator.clipboard.writeText(successUrl)
                    } finally {
                      setIsCopying(false)
                    }
                  }}
                >
                  {isCopying ? 'Copying…' : 'Copy link'}
                </button>
              </div>
            </div>
          ) : null}
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

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="workspace-panel island-shell">
          <p className="island-kicker mb-2">Staff directory</p>
          <h2 className="text-xl font-semibold text-[var(--sea-ink)]">Manage active staff</h2>
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
                    {member.status === 'active' ? (
                      <button
                        type="button"
                        className="button-secondary"
                        onClick={async () => {
                          try {
                            await deactivateStaffAccount({
                              data: { userId: member.id },
                            })
                            setStaffMembers((current) =>
                              current.map((row) =>
                                row.id === member.id
                                  ? { ...row, status: 'deactivated' }
                                  : row,
                              ),
                            )
                          } catch (submissionError) {
                            setError(
                              submissionError instanceof Error
                                ? submissionError.message
                                : 'Unable to deactivate that account.',
                            )
                          }
                        }}
                      >
                        Deactivate
                      </button>
                    ) : null}
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
                    <p className="m-0 text-sm text-[var(--sea-ink-soft)]">
                      Expires {invite.expiresAt.toLocaleString()}
                    </p>
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
