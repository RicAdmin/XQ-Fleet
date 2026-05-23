import { BRAND_LOGO_PATH } from '#/lib/brand'

type BrandLogoProps = {
  size?: number
  className?: string
  alt?: string
}

export default function BrandLogo({
  size = 32,
  className,
  alt = 'XQCar',
}: BrandLogoProps) {
  return (
    <img
      src={BRAND_LOGO_PATH}
      alt={alt}
      width={size}
      height={size}
      className={['brand-logo-img', className].filter(Boolean).join(' ')}
      style={{ width: size, height: size }}
    />
  )
}
