import { useState } from 'react'
import type { ReactNode } from 'react'

import { Link } from '@tanstack/react-router'
import {
  BarChart3,
  CalendarCheck,
  Car,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  Wrench,
} from 'lucide-react'

import { authClient } from '#/lib/auth-client'
import type { AppRole } from '#/lib/auth-model'
import { getRoleLabel } from '#/lib/auth-model'

type NavLinkTo =
  | '/admin'
  | '/admin/cars'
  | '/admin/customers'
  | '/admin/rentals'
  | '/admin/reports'
  | '/admin/settings'
  | '/app/customers'
  | '/app/rentals'
  | '/app/maintenance'

type NavSectionItem =
  | {
      type: 'link'
      label: string
      icon: ReactNode
      to: NavLinkTo
      /** Alternate path shown to staff (non-owner) instead of `to` */
      staffTo?: NavLinkTo
      exact: boolean
      ownerOnly?: boolean
    }
  | { type: 'placeholder'; label: string; icon: ReactNode }

type NavSection = {
  label: string
  items: NavSectionItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Overview',
    items: [
      {
        type: 'link',
        label: 'Dashboard',
        to: '/admin',
        icon: <LayoutDashboard size={16} />,
        exact: true,
        ownerOnly: true,
      },
    ],
  },
  {
    label: 'Fleet',
    items: [
      {
        type: 'link',
        label: 'Vehicles',
        to: '/admin/cars',
        icon: <Car size={16} />,
        exact: false,
      },
      { type: 'link', label: 'Rentals', icon: <CalendarCheck size={16} />, to: '/admin/rentals', staffTo: '/app/rentals', exact: false },
      {
        type: 'link',
        label: 'Customers',
        to: '/admin/customers',
        staffTo: '/app/customers',
        icon: <Users size={16} />,
        exact: false,
      },
      {
        type: 'link',
        label: 'Maintenance',
        to: '/admin/cars',
        staffTo: '/app/maintenance',
        icon: <Wrench size={16} />,
        exact: false,
        ownerOnly: false,
      },
      { type: 'link', label: 'Reports', icon: <BarChart3 size={16} />, to: '/admin/reports', exact: false, ownerOnly: true },
    ],
  },
  {
    label: 'Team',
    items: [{ type: 'placeholder', label: 'Staff', icon: <Users size={16} /> }],
  },
  {
    label: 'System',
    items: [
      {
        type: 'link',
        label: 'Settings',
        icon: <Settings size={16} />,
        to: '/admin/settings',
        exact: false,
        ownerOnly: true,
      },
    ],
  },
]

type AdminSidebarShellProps = {
  children: ReactNode
  pageTitle?: string
  user: { name: string; email: string; role?: AppRole | string }
}

export default function AdminSidebarShell({
  children,
  pageTitle = 'Dashboard',
  user,
}: AdminSidebarShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const initial = user.name.length > 0 ? user.name[0].toUpperCase() : 'A'
  const roleLabel = user.role ? getRoleLabel(user.role as AppRole) : 'Owner'
  const isOwner = user.role === 'owner' || !user.role

  const handleSignOut = async () => {
    await authClient.signOut()
    window.location.href = '/'
  }

  return (
    <div className="admin-layout">
      {mobileOpen && (
        <div
          className="admin-overlay"
          role="presentation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={[
          'admin-sidebar',
          collapsed ? 'is-collapsed' : '',
          mobileOpen ? 'is-open' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Brand */}
        <div className="sidebar-brand">
          <span className="sidebar-logo">
            <Car size={14} />
          </span>
          {!collapsed && <span className="sidebar-brand-name">XQ Fleet</span>}
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav" aria-label="Admin navigation">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="sidebar-section">
              {!collapsed && (
                <p className="sidebar-section-label">{section.label}</p>
              )}
          {section.items.map((item) => {
                if (item.type === 'link') {
                  if (item.ownerOnly && !isOwner) return null
                  const resolvedTo = (item.staffTo && !isOwner ? item.staffTo : item.to) as NavLinkTo
                  return (
                    <Link
                      key={item.label}
                      to={resolvedTo}
                      activeOptions={{ exact: item.exact }}
                      className="sidebar-nav-item"
                      activeProps={{ className: 'is-active' }}
                      aria-label={collapsed ? item.label : undefined}
                    >
                      <span className="sidebar-nav-icon">{item.icon}</span>
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  )
                }
                return (
                  <div
                    key={item.label}
                    className="sidebar-nav-item is-placeholder"
                    title={collapsed ? `${item.label} — coming soon` : undefined}
                    aria-label={`${item.label} — coming soon`}
                  >
                    <span className="sidebar-nav-icon">{item.icon}</span>
                    {!collapsed && (
                      <>
                        <span>{item.label}</span>
                        <span className="sidebar-soon">soon</span>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {!collapsed && (
            <div className="sidebar-user">
              <div className="sidebar-avatar">{initial}</div>
              <div className="sidebar-user-info">
                <p className="sidebar-user-name">{user.name}</p>
                <p className="sidebar-user-email">{user.email}</p>
              </div>
            </div>
          )}
          <button
            type="button"
            className="sidebar-sign-out"
            onClick={handleSignOut}
            aria-label="Sign out"
          >
            <LogOut size={15} />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-mobile-menu"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            <Menu size={18} />
          </button>
          <h1 className="admin-topbar-title">{pageTitle}</h1>
          <div className="admin-topbar-end">
            <span className="role-pill">{roleLabel}</span>
          </div>
        </header>
        <div className="admin-content">{children}</div>
      </main>
    </div>
  )
}
