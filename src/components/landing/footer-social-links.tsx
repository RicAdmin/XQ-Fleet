import { Facebook, Instagram } from 'lucide-react'

import { usePublicI18n } from '#/i18n/usePublicI18n'

const SOCIAL_LINKS = [
  {
    id: 'instagram',
    href: 'https://www.instagram.com/xqlangkawi/',
    labelKey: 'footer.instagram' as const,
    icon: 'instagram' as const,
  },
  {
    id: 'facebook',
    href: 'https://www.facebook.com/xqlangkawi',
    labelKey: 'footer.facebook' as const,
    icon: 'facebook' as const,
  },
  {
    id: 'tiktok',
    href: 'https://www.tiktok.com/@xqholidays',
    labelKey: 'footer.tiktok' as const,
    icon: 'tiktok' as const,
  },
  {
    id: 'xiaohongshu',
    href: 'https://www.rednote.com/user/profile/5d18cf0c000000001102e901',
    labelKey: 'footer.xiaohongshu' as const,
    icon: 'xiaohongshu' as const,
  },
] as const

function TikTokIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  )
}

function XiaohongshuIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm2 3v2h2.2l-1.4 4.6H6v2h2.1l-.5 1.6H6v2h2.6l1.1-3.6h2.1l1.1 3.6H15v-2h-2.1l-.5-1.6H15v-2h-1.8L14.6 9H17V7h-2.6l-1.1 3.6h-2.1L9.2 7H6zm4.3 0h2.1l1.1 3.6h-2.1L10.3 7z" />
    </svg>
  )
}

function SocialIcon({ type, size = 14 }: { type: (typeof SOCIAL_LINKS)[number]['icon']; size?: number }) {
  switch (type) {
    case 'instagram':
      return <Instagram size={size} aria-hidden />
    case 'facebook':
      return <Facebook size={size} aria-hidden />
    case 'tiktok':
      return <TikTokIcon size={size} />
    case 'xiaohongshu':
      return <XiaohongshuIcon size={size} />
  }
}

export function FooterSocialLinks() {
  const { t } = usePublicI18n()

  return (
    <div className="socials">
      {SOCIAL_LINKS.map((link) => (
        <a
          key={link.id}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t(link.labelKey)}
        >
          <SocialIcon type={link.icon} />
        </a>
      ))}
    </div>
  )
}
