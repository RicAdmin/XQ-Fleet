import { useState } from 'react'

import { Link, createFileRoute } from '@tanstack/react-router'

import AuthFrame from '#/components/auth/AuthFrame'
import PublicPageShell from '#/components/shells/PublicPageShell'
import { authClient } from '#/lib/auth-client'
import { acceptStaffInvitation, getStaffInvitation } from '#/lib/auth-functions'

export const Route = createFileRoute('/internal/invite/$token')({
  beforeLoad: async ({ params }) => ({
    invitation: await getStaffInvitation({ data: { token: params.token } }),
  }),
  component: AcceptInvitePage,
})

function AcceptInvitePage() {
  const navigate = Route.useNavigate()
  const { token } = Route.useParams()
  const { invitation } = Route.useRouteContext()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (invitation.status !== 'valid') {
    const message =
      invitation.status === 'accepted'
        ? 'This invitation has already been used.'
        : invitation.status === 'expired'
          ? 'This invitation has expired.'
          : invitation.status === 'revoked'
            ? 'This invitation has been revoked.'
            : 'We could not verify that invitation.'

    return (
      <PublicPageShell className="page-wrap px-4 pb-12 pt-8">
        <section className="island-shell rise-in rounded-[2rem] px-6 py-8 sm:px-10 sm:py-10">
          <p className="island-kicker mb-3">Invitation status</p>
          <h1 className="display-title mb-4 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl">
            {message}
          </h1>
          <p className="m-0 text-base leading-8 text-[var(--sea-ink-soft)]">
            Ask the owner for a fresh internal invite if you still need access.
          </p>
          <div className="mt-6">
            <Link to="/internal/login" className="button-secondary">
              Back to internal login
            </Link>
          </div>
        </section>
      </PublicPageShell>
    )
  }

  return (
    <PublicPageShell className="page-wrap px-4 pb-12 pt-8">
      <AuthFrame
        badge="Staff invitation"
        title="Accept your internal invite"
        description={`Create your staff credentials for ${invitation.email}. Once you finish, you'll land in the operational workspace.`}
        asideTitle="Easy to use by design"
        asideBody="This flow keeps the invite narrow: review the email, choose a name and password, then enter the app. No extra steps unless the invite itself is invalid."
        footer={
          <p className="m-0 text-sm text-[var(--sea-ink-soft)]">
            Invite expires on {invitation.expiresAt.toLocaleString()}.
          </p>
        }
      >
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault()
            setError(null)
            setIsSubmitting(true)

            try {
              const result = await acceptStaffInvitation({
                data: { token, name, password },
              })
              await authClient.signIn.email({ email: result.email, password })
              await navigate({ to: '/app' })
            } catch (submissionError) {
              setError(
                submissionError instanceof Error
                  ? submissionError.message
                  : 'Unable to accept the invitation right now.',
              )
            } finally {
              setIsSubmitting(false)
            }
          }}
        >
          <div>
            <label className="field-label" htmlFor="invite-name">
              Full name
            </label>
            <input
              id="invite-name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="field-input"
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="invite-password">
              Password
            </label>
            <input
              id="invite-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="field-input"
              minLength={8}
              required
            />
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" className="button-primary w-full justify-center" disabled={isSubmitting}>
            {isSubmitting ? 'Finishing setup…' : 'Activate staff account'}
          </button>
        </form>
      </AuthFrame>
    </PublicPageShell>
  )
}
