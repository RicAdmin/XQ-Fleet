import { Link, createFileRoute } from '@tanstack/react-router'

import AuthPageShell from '#/components/shells/AuthPageShell'
import { redirectAuthenticatedUser } from '#/lib/route-guards'

export const Route = createFileRoute('/forgot-password')({
  beforeLoad: async () => {
    await redirectAuthenticatedUser()
  },
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  return (
    <AuthPageShell>
      <div className="cxq-auth-split">
        <div className="cxq-auth-left">
          <div className="cxq-auth-left-inner">
            <span className="cxq-auth-eyebrow">Car XQ · Account help</span>
            <h2 className="cxq-auth-headline">Reset your password</h2>
            <p className="cxq-auth-body">
              Self-serve email reset is not wired here yet. Contact the team on WhatsApp and we will verify you
              quickly.
            </p>
          </div>
        </div>

        <div className="cxq-auth-right">
          <span className="cxq-auth-badge">Customer portal</span>
          <h3>Get help signing in</h3>
          <p className="cxq-auth-sub">
            Remembered it? <Link to="/login">Back to sign in</Link>
          </p>

          <p className="cxq-auth-forgot-copy">
            For security, password resets are handled by Car XQ support. Message us with the email on your account.
          </p>

          <a
            className="button-primary cxq-auth-submit"
            href="https://wa.me/601135215576"
            target="_blank"
            rel="noreferrer"
          >
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </AuthPageShell>
  )
}
