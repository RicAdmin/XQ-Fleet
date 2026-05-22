import { useState } from 'react'

import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { z } from 'zod'

import CxqAuthLegalFooter from '#/components/auth/CxqAuthLegalFooter'
import CxqAuthMarketingAside from '#/components/auth/CxqAuthMarketingAside'
import PublicAuthShell from '#/components/shells/PublicAuthShell'
import { cxqAuthSignInAside } from '#/lib/cxq-auth-marketing'
import { authClient } from '#/lib/auth-client'
import { appRoleFromSessionUser } from '#/lib/auth-model'
import { redirectAuthenticatedUser } from '#/lib/route-guards'

export const Route = createFileRoute('/login')({
  validateSearch: z.object({ returnTo: z.string().optional() }),
  beforeLoad: async () => {
    await redirectAuthenticatedUser()
  },
  component: CustomerLoginPage,
})

function CustomerLoginPage() {
  const navigate = Route.useNavigate()
  const { returnTo } = Route.useSearch()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <PublicAuthShell screenLabel="Car XQ Sign in" minimal>
      <div className="auth-page-card">
        <CxqAuthMarketingAside {...cxqAuthSignInAside} />

        <div className="auth-right">
          <span className="auth-badge">Customer access</span>
          <h3>Sign in</h3>
          <p className="auth-sub">
            New to Car XQ? <Link to="/register">Create an account</Link>
          </p>

          <form
            onSubmit={async (event) => {
              event.preventDefault()
              setError(null)
              setIsSubmitting(true)

              try {
                const signInResult = await authClient.signIn.email({ email, password })

                if (signInResult.error) {
                  throw new Error(signInResult.error.message ?? 'Sign in failed.')
                }

                let role = appRoleFromSessionUser(signInResult.data?.user)
                if (!role) {
                  const { data: session } = await authClient.getSession()
                  role = appRoleFromSessionUser(session?.user)
                }

                if (role !== 'customer') {
                  await authClient.signOut()
                  setError('Owner and staff accounts must use the internal login page.')
                  return
                }

                await navigate({ to: (returnTo as never) ?? '/account' })
              } catch (submissionError) {
                setError(
                  submissionError instanceof Error
                    ? submissionError.message
                    : 'Unable to sign in right now.',
                )
              } finally {
                setIsSubmitting(false)
              }
            }}
          >
            <div className="auth-fields">
              <div className="auth-field">
                <label htmlFor="customer-email">Email</label>
                <input
                  id="customer-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="customer-password">Password</label>
                <input
                  id="customer-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              <div className="auth-row-between">
                <Link to="/forgot-password" className="auth-link">
                  Forgot password?
                </Link>
              </div>
            </div>

            {error ? <p className="auth-error-banner">{error}</p> : null}

            <button
              type="submit"
              className="btn btn-leaf btn-lg auth-form-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
              {!isSubmitting ? <ArrowRight size={14} strokeWidth={2.5} aria-hidden /> : null}
            </button>

            <CxqAuthLegalFooter />
          </form>
        </div>
      </div>
    </PublicAuthShell>
  )
}
