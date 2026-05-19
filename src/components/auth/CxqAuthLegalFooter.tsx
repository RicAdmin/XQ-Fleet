import { Link } from '@tanstack/react-router'

export default function CxqAuthLegalFooter() {
  return (
    <p className="auth-tos">
      By continuing you agree to our terms and acknowledge our{' '}
      <Link to="/about" className="auth-link">
        Privacy Policy
      </Link>
      .
    </p>
  )
}
