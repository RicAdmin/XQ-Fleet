import type { CSSProperties, ReactNode } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Link, useMatchRoute } from '@tanstack/react-router'
import {
  ArrowLeftRight,
  BarChart3,
  CalendarRange,
  CalendarCheck,
  Car,
  CreditCard,
  Handshake,
  Layers,
  LogOut,
  MapPin,
  Tag,
  Users,
  Wrench,
} from 'lucide-react'

import BrandLogo from '#/components/BrandLogo'
import { AdminToastHost } from '#/components/ui/AdminToast'
import { Button } from '#/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '#/components/ui/sidebar'
import { TooltipProvider } from '#/components/ui/tooltip'
import { useAdminViewMode } from '#/hooks/use-admin-view-mode'
import { authClient } from '#/lib/auth-client'
import {
  appRoleFromSessionUser,
  getStaffProfileLabel,
  resolveDashboardPersona,
  staffProfileFromSessionUser,
  type AdminViewMode,
  type AppRole,
  type DashboardPersona,
} from '#/lib/auth-model'
import {
  resolveAdminNavSections,
  type AdminNavSection,
} from '#/lib/admin-nav'
import { INTERNAL_JOBS_PATH } from '#/lib/internal-routes'
import { cn } from '#/lib/utils'

const NAV_SECTIONS: AdminNavSection<ReactNode>[] = [
  {
    label: 'Manage',
    items: [
      {
        type: 'link',
        label: 'Operation',
        to: '/admin/operations',
        icon: <ArrowLeftRight />,
        exact: false,
        audiences: ['operations', 'admin'],
      },
      {
        type: 'link',
        label: 'Job',
        to: INTERNAL_JOBS_PATH,
        icon: <CalendarCheck />,
        exact: false,
      },
      {
        type: 'link',
        label: 'Availability',
        to: '/admin/availability',
        icon: <CalendarRange />,
        exact: false,
      },
      {
        type: 'link',
        label: 'Payment',
        to: '/admin/payments',
        icon: <CreditCard />,
        exact: false,
      },
      {
        type: 'link',
        label: 'Customer',
        to: '/admin/customers',
        icon: <Users />,
        exact: false,
        audiences: ['customer_service', 'admin'],
      },
    ],
  },
  {
    label: 'Maintenance',
    audiences: ['operations', 'admin'],
    items: [
      {
        type: 'link',
        label: 'Maintenance',
        to: '/admin/maintenance',
        icon: <Wrench />,
        exact: false,
      },
    ],
  },
  {
    label: 'Insight',
    audiences: ['admin'],
    items: [
      {
        type: 'link',
        label: 'Customer',
        to: '/admin/customers',
        icon: <Users />,
        exact: false,
      },
      {
        type: 'link',
        label: 'Reports',
        to: '/admin/reports',
        icon: <BarChart3 />,
        exact: false,
      },
      {
        type: 'link',
        label: 'Promo code',
        to: '/admin/promos',
        icon: <Tag />,
        exact: false,
      },
    ],
  },
  {
    label: 'Configuration',
    audiences: ['admin'],
    items: [
      {
        type: 'link',
        label: 'Car models',
        to: '/admin/car-models',
        icon: <Layers />,
        exact: false,
      },
      {
        type: 'link',
        label: 'Vehicle',
        to: '/admin/cars',
        icon: <Car />,
        exact: false,
      },
      {
        type: 'link',
        label: 'Partner',
        to: '/admin/partners',
        icon: <Handshake />,
        exact: false,
      },
      {
        type: 'link',
        label: 'Location',
        to: '/admin/locations',
        icon: <MapPin />,
        exact: false,
      },
      {
        type: 'link',
        label: 'Staff',
        to: '/admin/staff',
        icon: <Users />,
        exact: false,
      },
    ],
  },
]

function formatTopbarDate(date: Date): string {
  return date.toLocaleDateString('en-MY', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getPersonaLabel(persona: DashboardPersona): string {
  if (persona === 'admin') return 'Admin'
  return getStaffProfileLabel(persona)
}

type AdminSidebarShellProps = {
  children: ReactNode
  pageTitle?: string
  user: { name: string; email: string; role?: AppRole | string; staffProfile?: string | null }
}

function AdminNavMenu({
  sections,
}: {
  sections: ReturnType<typeof resolveAdminNavSections<ReactNode>>
}) {
  const matchRoute = useMatchRoute()

  return (
    <>
      {sections.map((section) => (
        <SidebarGroup key={section.label}>
          <SidebarGroupLabel className="admin-sidebar-section-label px-2">
            {section.label}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {section.items.map((item) => {
                if (item.type === 'placeholder') {
                  return (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        disabled
                        tooltip={`${item.label} — coming soon`}
                        className="opacity-55"
                        aria-label={`${item.label} — coming soon`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                        <span className="admin-nav-soon">soon</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                }

                const isActive = Boolean(
                  matchRoute({
                    to: item.href,
                    fuzzy: !item.exact,
                  }),
                )

                return (
                  <SidebarMenuItem key={`${section.label}-${item.label}`}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      className={cn(
                        'admin-nav-link no-underline',
                        isActive && 'is-active',
                      )}
                      render={
                        <Link
                          to={item.href}
                          activeOptions={{ exact: item.exact }}
                          preload="intent"
                          preloadDelay={80}
                        />
                      }
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  )
}

const VIEW_MODE_OPTIONS: { mode: AdminViewMode; label: string }[] = [
  { mode: 'customer_service', label: 'CS' },
  { mode: 'operations', label: 'Ops' },
  { mode: 'admin', label: 'AD' },
]

const HOVER_COLLAPSE_DELAY_MS = 250

type NavFlyoutMode = 'collapsed' | 'hover' | 'pinned'

/**
 * Desktop icon-rail sidebar with hover overlay expand.
 * Mouse handlers live on Sidebar (props forward to the fixed container).
 */
function AdminHoverSidebar({
  children,
  className,
  onHoveringChange,
}: {
  children: ReactNode
  className?: string
  onHoveringChange: (hovering: boolean) => void
}) {
  const { isMobile } = useSidebar()
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearLeaveTimer = useCallback(() => {
    if (leaveTimerRef.current != null) {
      clearTimeout(leaveTimerRef.current)
      leaveTimerRef.current = null
    }
  }, [])

  useEffect(() => () => clearLeaveTimer(), [clearLeaveTimer])

  if (isMobile) {
    return (
      <Sidebar collapsible="icon" className={className}>
        {children}
      </Sidebar>
    )
  }

  return (
    <Sidebar
      collapsible="icon"
      className={className}
      onMouseEnter={() => {
        clearLeaveTimer()
        onHoveringChange(true)
      }}
      onMouseLeave={() => {
        clearLeaveTimer()
        leaveTimerRef.current = setTimeout(() => {
          const active = document.activeElement
          const container = document.querySelector(
            '.cxq-dashboard-root [data-slot="sidebar-container"]',
          )
          if (
            container &&
            active instanceof Node &&
            container.contains(active)
          ) {
            return
          }
          onHoveringChange(false)
        }, HOVER_COLLAPSE_DELAY_MS)
      }}
      onFocusCapture={() => {
        clearLeaveTimer()
        onHoveringChange(true)
      }}
    >
      {children}
    </Sidebar>
  )
}

function ViewModeToggle({
  value,
  onChange,
}: {
  value: AdminViewMode
  onChange: (mode: AdminViewMode) => void
}) {
  return (
    <div
      className="admin-view-mode-toggle hidden items-center rounded-md border border-[var(--line)] bg-[var(--surface-muted)] p-0.5 sm:flex"
      role="group"
      aria-label="Switch dashboard view"
    >
      {VIEW_MODE_OPTIONS.map(({ mode, label }) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={cn(
            'rounded px-2 py-1 text-xs font-semibold transition-colors',
            value === mode
              ? 'bg-white text-[var(--sea-ink)] shadow-sm'
              : 'text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export default function AdminSidebarShell({
  children,
  user,
}: AdminSidebarShellProps) {
  const role = appRoleFromSessionUser(user) ?? 'staff'
  const isSuperAdmin = role === 'super_admin'
  const { viewMode, setViewMode } = useAdminViewMode(isSuperAdmin)
  const persona = resolveDashboardPersona({
    role,
    staffProfile: staffProfileFromSessionUser(user),
    viewMode: isSuperAdmin ? viewMode : null,
  })
  const navSections = resolveAdminNavSections(NAV_SECTIONS, { persona })
  const now = new Date()
  const today = formatTopbarDate(now)
  const todayIso = now.toISOString().slice(0, 10)
  const displayName = user.name?.trim() || user.email

  const [pinned, setPinned] = useState(false)
  const [hovering, setHovering] = useState(false)
  const open = pinned || hovering
  const navFlyout: NavFlyoutMode = pinned ? 'pinned' : hovering ? 'hover' : 'collapsed'

  const handleSignOut = async () => {
    await authClient.signOut()
    window.location.href = '/'
  }

  return (
    <TooltipProvider>
      <SidebarProvider
        defaultOpen={false}
        open={open}
        onOpenChange={(next) => {
          setPinned(next)
          if (!next) setHovering(false)
        }}
        className="cxq-light-surface admin-shell-layout min-h-svh"
        data-nav-flyout={navFlyout}
        style={
          {
            '--sidebar-width': '14rem',
            '--sidebar-width-icon': '3.25rem',
            '--sidebar': '#ffffff',
            '--sidebar-foreground': 'var(--sea-ink, #14181a)',
            '--sidebar-accent': 'var(--ember-wash)',
            '--sidebar-accent-foreground': 'var(--sea-ink, #14181a)',
            '--sidebar-border': 'var(--line, #e4e6ea)',
            '--sidebar-ring': 'var(--ember)',
          } as CSSProperties
        }
      >
        <AdminHoverSidebar
          className="admin-sidebar-panel border-r border-[var(--line)]"
          onHoveringChange={setHovering}
        >
          <SidebarHeader className="admin-sidebar-header border-b border-[var(--line)] bg-[var(--surface-strong)]">
            <div className="admin-sidebar-brand">
              <BrandLogo size={36} className="shrink-0" decorative />
              <p className="admin-sidebar-brand-text truncate group-data-[collapsible=icon]:hidden">
                CarOS
              </p>
            </div>
          </SidebarHeader>

          <SidebarContent className="bg-[var(--surface-strong)]">
            <AdminNavMenu sections={navSections} />
          </SidebarContent>

          <SidebarRail />
        </AdminHoverSidebar>

        <SidebarInset className="admin-main-canvas">
          <header className="admin-topbar sticky top-0 z-10 flex items-center gap-2.5 border-b border-[var(--line)] px-3 md:px-5">
            <SidebarTrigger
              className="-ml-0.5 size-8 text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)] md:hidden"
              aria-label="Open menu"
            />
            <div className="admin-topbar-meta min-w-0 flex-1 truncate">
              <p className="truncate leading-tight">
                <span className="admin-topbar-user">
                  {displayName}
                  <span className="admin-topbar-persona"> ({getPersonaLabel(persona)})</span>
                </span>
              </p>
            </div>
            <div className="admin-topbar-actions flex shrink-0 items-center gap-2">
              {isSuperAdmin ? (
                <ViewModeToggle
                  value={viewMode}
                  onChange={(mode) => setViewMode(mode)}
                />
              ) : null}
              <p className="admin-topbar-context hidden truncate leading-tight sm:block">
                <time dateTime={todayIso}>{today}</time>
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="admin-topbar-signout gap-1.5 rounded-md border-[var(--line)] font-medium text-[var(--sea-ink-soft)] hover:bg-[var(--surface-muted)] hover:text-[var(--sea-ink)]"
              >
                <LogOut className="size-4" aria-hidden />
                Sign out
              </Button>
            </div>
          </header>
          <div className="admin-main-content">
            {children}
          </div>
        </SidebarInset>
        <AdminToastHost />
      </SidebarProvider>
    </TooltipProvider>
  )
}
