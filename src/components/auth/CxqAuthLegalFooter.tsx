import { Link } from '@tanstack/react-router'

export default function CxqAuthLegalFooter() {
  return (
    <p className="auth-tos">
      By continuing you agree to our{' '}
      <Link to="/terms" className="auth-link">
        Terms &amp; Conditions
      </Link>{' '}
      and acknowledge our{' '}
      <Link to="/privacy" className="auth-link">
        Privacy Policy
      </Link>
      .
    </p>
  )
}
