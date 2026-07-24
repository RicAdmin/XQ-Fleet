import { BRAND_LOGO_PATH } from '#/lib/brand'

type BrandLogoProps = {
  size?: number
  className?: string
  alt?: string
  /** When paired with visible brand text, mark decorative for screen readers. */
  decorative?: boolean
}

export default function BrandLogo({
  size = 32,
  className,
  alt = 'XQCar',
  decorative = false,
}: BrandLogoProps) {
  return (
    <img
      src={BRAND_LOGO_PATH}
      srcSet={`${BRAND_LOGO_PATH} 96w`}
      sizes={`${size}px`}
      alt={decorative ? '' : alt}
      aria-hidden={decorative ? true : undefined}
      width={size}
      height={size}
      className={['brand-logo-img', className].filter(Boolean).join(' ')}
      style={{ width: size, height: size }}
    />
  )
}
