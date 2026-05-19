import { Link, createFileRoute } from '@tanstack/react-router'

import PublicAuthShell from '#/components/shells/PublicAuthShell'
import { redirectAuthenticatedUser } from '#/lib/route-guards'

export const Route = createFileRoute('/forgot-password')({
  beforeLoad: async () => {
    await redirectAuthenticatedUser()
  },
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  return (
    <PublicAuthShell screenLabel="Car XQ Forgot password">
      <div className="auth-page-card">
        <div className="auth-left">
          <div className="auth-left-inner">
            <span className="eyebrow">Car XQ · Account help</span>
            <h2>Reset your password</h2>
            <p>
              Self-serve email reset is not wired here yet. Contact the team on WhatsApp and we will verify you
              quickly.
            </p>
          </div>
        </div>

        <div className="auth-right">
          <span className="auth-badge">Customer portal</span>
          <h3>Get help signing in</h3>
          <p className="auth-sub">
            Remembered it? <Link to="/login">Back to sign in</Link>
          </p>

          <p className="auth-forgot-copy">
            For security, password resets are handled by Car XQ support. Message us with the email on your account.
          </p>

          <a
            className="btn btn-leaf btn-lg auth-form-submit"
            href="https://wa.me/601135215576"
            target="_blank"
            rel="noreferrer"
          >
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </PublicAuthShell>
  )
}
