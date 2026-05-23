import { AUTH_ASIDE_BG } from '#/components/landing/cxq-landing-data'

type CxqAuthMarketingAsideProps = {
  slogan: string
  backgroundImage?: string
}

export default function CxqAuthMarketingAside({
  slogan,
  backgroundImage = AUTH_ASIDE_BG,
}: CxqAuthMarketingAsideProps) {
  const bgUrl = backgroundImage.includes(' ') ? encodeURI(backgroundImage) : backgroundImage
  return (
    <div
      className="auth-left auth-left--photo"
      style={{ '--auth-left-bg': `url("${bgUrl}")` } as React.CSSProperties}
    >
      <div className="auth-left-inner">
        <p className="auth-left-slogan">{slogan}</p>
      </div>
    </div>
  )
}
