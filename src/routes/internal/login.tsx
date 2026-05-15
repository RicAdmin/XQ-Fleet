import { useState } from 'react'

import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

import CxqAuthMarketingAside from '#/components/auth/CxqAuthMarketingAside'
import AuthPageShell from '#/components/shells/AuthPageShell'
import { cxqAuthInternalAside } from '#/lib/cxq-auth-marketing'
import { authClient } from '#/lib/auth-client'
import { createInitialOwner } from '#/lib/auth-functions'
import { appRoleFromSessionUser } from '#/lib/auth-model'
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
    <AuthPageShell>
      <div className="cxq-auth-split">
        <CxqAuthMarketingAside {...cxqAuthInternalAside} />

        <div className="cxq-auth-right">
          <span className="cxq-auth-badge">Internal workspace</span>
          <h3>{title}</h3>
          <p className="cxq-auth-sub">
            Renting as a customer? <Link to="/login">Customer sign in</Link>
          </p>

          {!hasOwner ? (
            <p className="cxq-auth-internal-note">
              This step only appears before the first owner account exists.
            </p>
          ) : null}

          <form
            className="cxq-auth-internal-form"
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

                const role = appRoleFromSessionUser(session?.user)

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
            <div className="cxq-auth-fields">
              {!hasOwner ? (
                <div className="cxq-auth-field">
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

              <div className="cxq-auth-field">
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

              <div className="cxq-auth-field">
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

            {error ? <p className="cxq-auth-error">{error}</p> : null}

            <button
              type="submit"
              className="button-primary cxq-auth-submit cxq-auth-submit-with-icon"
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
    </AuthPageShell>
  )
}
