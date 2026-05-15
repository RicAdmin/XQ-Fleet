import { useState } from 'react'

import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { z } from 'zod'

import CxqAuthLegalFooter from '#/components/auth/CxqAuthLegalFooter'
import CxqAuthMarketingAside from '#/components/auth/CxqAuthMarketingAside'
import CxqAuthSocialButtons from '#/components/auth/CxqAuthSocialButtons'
import AuthPageShell from '#/components/shells/AuthPageShell'
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
  const [isOAuthLoading, setIsOAuthLoading] = useState(false)

  async function handleGoogleSignIn() {
    setIsOAuthLoading(true)
    await authClient.signIn.social({ provider: 'google', callbackURL: returnTo ?? '/account' })
  }

  return (
    <AuthPageShell>
      <div className="cxq-auth-split">
        <CxqAuthMarketingAside {...cxqAuthSignInAside} />

        <div className="cxq-auth-right">
          <span className="cxq-auth-badge">Customer access</span>
          <h3>Sign in</h3>
          <p className="cxq-auth-sub">
            New to Car XQ? <Link to="/register">Create an account</Link>
          </p>

          <CxqAuthSocialButtons
            onGoogle={handleGoogleSignIn}
            disabled={isOAuthLoading || isSubmitting}
            googleLabel={isOAuthLoading ? 'Redirecting…' : 'Continue with Google'}
          />

          <div className="cxq-auth-divider">
            <span>or with email</span>
          </div>

          <form
            onSubmit={async (event) => {
              event.preventDefault()
              setError(null)
              setIsSubmitting(true)

              try {
                await authClient.signIn.email({ email, password })
                const { data: session } = await authClient.getSession()

                const role = appRoleFromSessionUser(session?.user)

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
            <div className="cxq-auth-fields">
              <div className="cxq-auth-field">
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

              <div className="cxq-auth-field">
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

              <div className="cxq-auth-row-between">
                <label className="cxq-auth-check">
                  <input type="checkbox" />
                  Remember me on this device
                </label>
                <Link to="/forgot-password" className="cxq-auth-link">
                  Forgot password?
                </Link>
              </div>
            </div>

            {error ? <p className="cxq-auth-error">{error}</p> : null}

            <button
              type="submit"
              className="button-primary cxq-auth-submit cxq-auth-submit-with-icon"
              disabled={isSubmitting || isOAuthLoading}
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
              {!isSubmitting ? <ArrowRight size={14} strokeWidth={2.5} aria-hidden /> : null}
            </button>

            <CxqAuthLegalFooter />
          </form>
        </div>
      </div>
    </AuthPageShell>
  )
}
