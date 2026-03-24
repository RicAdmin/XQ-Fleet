import { useState } from 'react'

import { createFileRoute } from '@tanstack/react-router'

import AuthFrame from '#/components/auth/AuthFrame'
import PublicPageShell from '#/components/shells/PublicPageShell'
import { authClient } from '#/lib/auth-client'
import { createInitialOwner } from '#/lib/auth-functions'
import { isAppRole } from '#/lib/auth-model'
import { loadInternalLoginState } from '#/lib/route-guards'

export const Route = createFileRoute('/internal/login')({
  beforeLoad: async () => {
    return loadInternalLoginState()
  },
  component: InternalLoginPage,
})

function InternalLoginPage() {
  const navigate = Route.useNavigate()
  const { hasOwner } = Route.useRouteContext()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const title = hasOwner ? 'Internal sign in' : 'Create the first owner account'

  return (
    <PublicPageShell className="page-wrap px-4 pb-12 pt-8">
      <AuthFrame
        badge="Internal workspace"
        title={title}
        description={
          hasOwner
            ? undefined
            : 'Set up the owner account once, then continue into the admin workspace.'
        }
        variant="compact"
      >
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault()
            setError(null)
            setIsSubmitting(true)

              try {
                if (!hasOwner) {
                  await createInitialOwner({
                    data: { name, email, password },
                  })
                  await authClient.signIn.email({ email, password })
                  await navigate({ to: '/admin' })
                  return
              }

              await authClient.signIn.email({ email, password })
              const { data: session } = await authClient.getSession()

              const role = session?.user && isAppRole(session.user.role) ? session.user.role : null

              if (role === 'customer') {
                await authClient.signOut()
                setError('Customer accounts must use the customer login page.')
                return
              }

              if (!role) {
                setError('Unable to determine which internal workspace to open.')
                return
              }

              await navigate({ to: role === 'owner' ? '/admin' : '/app' })
            } catch (submissionError) {
              setError(
                submissionError instanceof Error
                  ? submissionError.message
                  : 'Unable to continue right now.',
              )
            } finally {
              setIsSubmitting(false)
            }
          }}
        >
          {!hasOwner ? (
            <p className="rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.38)] px-4 py-3 text-sm leading-7 text-[var(--sea-ink-soft)]">
              This only appears before the first owner account exists.
            </p>
          ) : null}
          {!hasOwner ? (
            <div>
              <label className="field-label" htmlFor="owner-name">
                Owner name
              </label>
              <input
                id="owner-name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="field-input"
                required
              />
            </div>
          ) : null}
          <div>
            <label className="field-label" htmlFor="internal-email">
              Email
            </label>
            <input
              id="internal-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="field-input"
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="internal-password">
              Password
            </label>
            <input
              id="internal-password"
              type="password"
              autoComplete={hasOwner ? 'current-password' : 'new-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="field-input"
              minLength={8}
              required
            />
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" className="button-primary w-full justify-center" disabled={isSubmitting}>
            {isSubmitting
              ? 'Working…'
              : hasOwner
                ? 'Continue'
                : 'Create owner account'}
          </button>
        </form>
      </AuthFrame>
    </PublicPageShell>
  )
}
