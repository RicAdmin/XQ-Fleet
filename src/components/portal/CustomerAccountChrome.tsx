import type { ReactNode } from 'react'

import { Link, useRouterState } from '@tanstack/react-router'
import { ArrowLeft, Car, LogOut, Mail, Phone, Sparkles, Users } from 'lucide-react'

import { authClient } from '#/lib/auth-client'

export type CustomerAccountTab = 'profile' | 'rentals' | 'notifications'

type SessionUser = {
  id: string
  name: string
  email: string
  createdAt?: Date | string
}

type CustomerAccountChromeProps = {
  session: { user: SessionUser }
  bookingsCount: number
  displayPhone: string
  children: ReactNode
}

function memberSinceLabel(createdAt: Date | string | undefined) {
  if (!createdAt) return 'Breeze member'
  const d = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
  if (Number.isNaN(d.getTime())) return 'Breeze member'
  const month = d.toLocaleString('en-GB', { month: 'long' })
  const year = d.getFullYear()
  return `Breeze member · since ${month} ${year}`
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function CustomerAccountChrome({
  session,
  bookingsCount,
  displayPhone,
  children,
}: CustomerAccountChromeProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const activeTab: CustomerAccountTab = pathname.startsWith('/account/notifications')
    ? 'notifications'
    : pathname.startsWith('/account/rentals') || pathname.startsWith('/account/bookings')
      ? 'rentals'
      : 'profile'

  const tabs: Array<{
    id: CustomerAccountTab
    to: '/account/profile' | '/account/rentals' | '/account/notifications'
    label: string
    icon: typeof Users
    badge?: number
  }> = [
    { id: 'profile', to: '/account/profile', label: 'Profile', icon: Users },
    { id: 'rentals', to: '/account/rentals', label: 'My rentals', icon: Car, badge: bookingsCount },
    {
      id: 'notifications',
      to: '/account/notifications',
      label: 'Notifications',
      icon: Phone,
    },
  ]

  async function handleSignOut() {
    await authClient.signOut()
    window.location.href = '/'
  }

  const { user } = session

  return (
    <div className="cxq-profile-page">
      <div className="cxq-profile-hero">
        <div className="cxq-profile-hero-top">
          <Link to="/" className="cxq-profile-back" aria-label="Back to home">
            <ArrowLeft size={16} strokeWidth={2.25} />
          </Link>
          <button type="button" className="cxq-profile-signout" onClick={() => void handleSignOut()}>
            <LogOut size={15} strokeWidth={2.25} />
            <span>Sign out</span>
          </button>
        </div>

        <div className="cxq-profile-hero-grid cxq-profile-hero-grid--solo">
          <div className="cxq-profile-id-card">
            <div className="cxq-profile-id-avatar">{initialsFromName(user.name)}</div>
            <div className="cxq-profile-id-body">
              <span className="cxq-profile-id-eyebrow">
                <Sparkles size={11} strokeWidth={2} aria-hidden />
                {memberSinceLabel(user.createdAt)}
              </span>
              <h1>{user.name}</h1>
              <div className="cxq-profile-id-contact">
                <span>
                  <Mail size={12} strokeWidth={2} aria-hidden />
                  <span>{user.email}</span>
                </span>
                <span className="cxq-profile-id-dot" aria-hidden>
                  ·
                </span>
                <span>
                  <Phone size={12} strokeWidth={2} aria-hidden />
                  <span>{displayPhone || '—'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <nav className="cxq-profile-tabbar" aria-label="Account sections">
          {tabs.map((t) => {
            const Icon = t.icon
            const on = activeTab === t.id
            return (
              <Link
                key={t.id}
                to={t.to}
                className={'cxq-profile-tabbar-btn' + (on ? ' on' : '')}
                aria-current={on ? 'page' : undefined}
              >
                <Icon size={15} strokeWidth={2} />
                <span>{t.label}</span>
                {t.id === 'rentals' && t.badge !== undefined && t.badge > 0 ? (
                  <span className="cxq-profile-tabbar-badge">{t.badge}</span>
                ) : null}
              </Link>
            )
          })}
        </nav>
      </div>

      {children}
    </div>
  )
}
