import { useState } from 'react'

import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { z } from 'zod'

import CxqAuthLegalFooter from '#/components/auth/CxqAuthLegalFooter'
import CxqAuthMarketingAside from '#/components/auth/CxqAuthMarketingAside'
import PublicAuthShell from '#/components/shells/PublicAuthShell'
import { cxqAuthSignUpAside } from '#/lib/cxq-auth-marketing'
import { authClient } from '#/lib/auth-client'
import { redirectAuthenticatedUser } from '#/lib/route-guards'

export const Route = createFileRoute('/register')({
  validateSearch: z.object({ returnTo: z.string().optional() }),
  beforeLoad: async () => {
    await redirectAuthenticatedUser()
  },
  component: CustomerRegisterPage,
})

function CustomerRegisterPage() {
  const navigate = Route.useNavigate()
  const { returnTo } = Route.useSearch()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <PublicAuthShell screenLabel="Car XQ Register" minimal>
      <div className="auth-page-card">
        <CxqAuthMarketingAside {...cxqAuthSignUpAside} />

        <div className="auth-right">
          <span className="auth-badge">New account</span>
          <h3>Create your account</h3>
          <p className="auth-sub">
            Already a member? <Link to="/login">Sign in</Link>
          </p>

          <form
            onSubmit={async (event) => {
              event.preventDefault()
              setError(null)

              if (!agreedToTerms) {
                setError('Please agree to the terms to continue.')
                return
              }

              setIsSubmitting(true)

              try {
                await authClient.signUp.email({ name, email, password })
                await navigate({ to: (returnTo as never) ?? '/account' })
              } catch (submissionError) {
                setError(
                  submissionError instanceof Error
                    ? submissionError.message
                    : 'Unable to create your account right now.',
                )
              } finally {
                setIsSubmitting(false)
              }
            }}
          >
            <div className="auth-fields">
              <div className="auth-field">
                <label htmlFor="customer-name">Full name</label>
                <input
                  id="customer-name"
                  type="text"
                  autoComplete="name"
                  placeholder="As shown on your driver's license"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="register-email">Email</label>
                <input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="register-password">Password</label>
                <input
                  id="register-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  required
                />
              </div>

              <label className="auth-check">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(event) => setAgreedToTerms(event.target.checked)}
                />
                I agree to the{' '}
                <Link to="/about" className="auth-link">
                  Rental Contract
                </Link>{' '}
                and{' '}
                <Link to="/about" className="auth-link">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {error ? <p className="auth-error-banner">{error}</p> : null}

            <button
              type="submit"
              className="btn btn-leaf btn-lg auth-form-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating account…' : 'Create account'}
              {!isSubmitting ? <ArrowRight size={14} strokeWidth={2.5} aria-hidden /> : null}
            </button>

            <CxqAuthLegalFooter />
          </form>
        </div>
      </div>
    </PublicAuthShell>
  )
}
