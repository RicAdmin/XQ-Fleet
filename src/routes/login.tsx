import { useState } from 'react'

import { Link, createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import AuthFrame from '#/components/auth/AuthFrame'
import AuthPageShell from '#/components/shells/AuthPageShell'
import { authClient } from '#/lib/auth-client'
import { isAppRole } from '#/lib/auth-model'
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
    <AuthPageShell>
      <AuthFrame
        badge="Customer access"
        title="Sign in"
        variant="compact"
        footer={
          <p className="m-0 text-sm text-[var(--sea-ink-soft)]">
            Need an account? <Link to="/register">Create one here.</Link>
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
              await authClient.signIn.email({ email, password })
              const { data: session } = await authClient.getSession()

              const role = session?.user && isAppRole(session.user.role) ? session.user.role : null

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
          <div>
            <label className="field-label" htmlFor="customer-email">
              Email
            </label>
            <input
              id="customer-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="field-input"
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="customer-password">
              Password
            </label>
            <input
              id="customer-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="field-input"
              required
            />
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" className="button-primary w-full justify-center" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Continue'}
          </button>
        </form>
      </AuthFrame>
    </AuthPageShell>
  )
}
