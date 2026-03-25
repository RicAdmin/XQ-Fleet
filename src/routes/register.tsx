import { useState } from 'react'

import { Link, createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import AuthFrame from '#/components/auth/AuthFrame'
import PublicPageShell from '#/components/shells/PublicPageShell'
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
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <PublicPageShell className="page-wrap px-4 pb-12 pt-8">
      <AuthFrame
        badge="Portal onboarding"
        title="Create a customer account"
        description="This keeps customer access separate from the internal workspace while still using the same secure auth system underneath."
        asideTitle="Stage 1 scope"
        asideBody="Registration is intentionally lightweight here so the customer surface can stay easy to use while the deeper booking flow arrives in later stages."
        footer={
          <p className="m-0 text-sm text-[var(--sea-ink-soft)]">
            Already registered? <Link to="/login">Sign in instead.</Link>
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
          <div>
            <label className="field-label" htmlFor="customer-name">
              Full name
            </label>
            <input
              id="customer-name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="field-input"
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="register-email">
              Email
            </label>
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="field-input"
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="register-password">
              Password
            </label>
            <input
              id="register-password"
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
            {isSubmitting ? 'Creating account…' : 'Create customer account'}
          </button>
        </form>
      </AuthFrame>
    </PublicPageShell>
  )
}
