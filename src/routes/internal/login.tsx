import { useState } from 'react'

import { createFileRoute } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

import CxqAuthMarketingAside from '#/components/auth/CxqAuthMarketingAside'
import PublicAuthShell from '#/components/shells/PublicAuthShell'
import { authClient } from '#/lib/auth-client'
import { createInitialOwner } from '#/lib/auth-functions'
import { appRoleFromSessionUser, getHomePathForRole } from '#/lib/auth-model'
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

  const title = hasOwner ? 'Sign in' : 'Create the first owner account'

  return (
    <PublicAuthShell screenLabel="XQ Car Internal login" minimal>
      <div className="auth-page-card">
        <CxqAuthMarketingAside slogan="Secure access to your workspace." />

        <div className="auth-right">
          <span className="auth-badge">Staff</span>
          <h3>{title}</h3>

          {!hasOwner ? (
            <p className="auth-internal-note">
              This step only appears before the first owner account exists.
            </p>
          ) : null}

          <form
            className="auth-internal-form"
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

                const signInResult = await authClient.signIn.email({ email, password })

                if (signInResult.error) {
                  throw new Error(signInResult.error.message ?? 'Sign in failed.')
                }

                let role = appRoleFromSessionUser(signInResult.data?.user)
                if (!role) {
                  const { data: session } = await authClient.getSession()
                  role = appRoleFromSessionUser(session?.user)
                }

                if (role === 'customer') {
                  await authClient.signOut()
                  setError('Customer accounts must use the customer login page.')
                  return
                }

                if (!role) {
                  setError('Unable to determine which internal workspace to open.')
                  return
                }

                await navigate({ to: getHomePathForRole(role) })
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
            <div className="auth-fields">
              {!hasOwner ? (
                <div className="auth-field">
                  <label htmlFor="owner-name">Owner name</label>
                  <input
                    id="owner-name"
                    autoComplete="name"
                    placeholder="Your full name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                </div>
              ) : null}

              <div className="auth-field">
                <label htmlFor="internal-email">Email</label>
                <input
                  id="internal-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="internal-password">Password</label>
                <input
                  id="internal-password"
                  type="password"
                  autoComplete={hasOwner ? 'current-password' : 'new-password'}
                  placeholder={hasOwner ? 'Your password' : 'Choose a strong password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  required
                />
              </div>
            </div>

            {error ? <p className="auth-error-banner">{error}</p> : null}

            <button
              type="submit"
              className="btn btn-leaf btn-lg auth-form-submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Working…'
                : hasOwner
                  ? 'Continue'
                  : 'Create owner account'}
              {!isSubmitting ? <ArrowRight size={14} strokeWidth={2.5} aria-hidden /> : null}
            </button>
          </form>
        </div>
      </div>
    </PublicAuthShell>
  )
}
