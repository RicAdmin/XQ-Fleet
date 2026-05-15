type CxqAuthSocialButtonsProps = {
  onGoogle: () => void | Promise<void>
  disabled?: boolean
  googleLabel?: string
}

export default function CxqAuthSocialButtons({
  onGoogle,
  disabled,
  googleLabel = 'Continue with Google',
}: CxqAuthSocialButtonsProps) {
  return (
    <div className="cxq-auth-oauth">
      <button
        type="button"
        className="cxq-auth-oauth-btn"
        onClick={() => void onGoogle()}
        disabled={disabled}
      >
        <span className="cxq-auth-oauth-logo">G</span>
        {googleLabel}
      </button>
      <button type="button" className="cxq-auth-oauth-btn" disabled={disabled} title="Coming soon">
        <span className="cxq-auth-oauth-logo cxq-auth-oauth-logo--apple" aria-hidden />
        Continue with Apple
      </button>
    </div>
  )
}
