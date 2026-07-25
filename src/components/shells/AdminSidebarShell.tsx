import type { CSSProperties, ReactNode } from 'react'

import { Link, useMatchRoute } from '@tanstack/react-router'
import {
  ArrowLeftRight,
  BarChart3,
  CalendarCheck,
  Car,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Settings,
  Tag,
  Users,
  Wrench,
} from 'lucide-react'

import BrandLogo from '#/components/BrandLogo'
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
} from '#/components/ui/sidebar'
import { TooltipProvider } from '#/components/ui/tooltip'
import { authClient } from '#/lib/auth-client'
import type { AppRole } from '#/lib/auth-model'
import {
  resolveAdminNavSections,
  type AdminNavSection,
} from '#/lib/admin-nav'
import { cn } from '#/lib/utils'

const NAV_SECTIONS: AdminNavSection<ReactNode>[] = [
  {
    label: 'Overview',
    items: [
      {
        type: 'link',
        label: 'Dashboard',
        to: '/admin/',
        icon: <LayoutDashboard />,
        exact: true,
        ownerOnly: true,
      },
      {
        type: 'link',
        label: 'Operation',
        to: '/admin/operations',
        icon: <ArrowLeftRight />,
        exact: false,
      },
      {
        type: 'link',
        label: 'Payments',
        to: '/admin/payments',
        icon: <CreditCard />,
        exact: false,
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
        icon: <Car />,
        exact: false,
      },
      {
        type: 'link',
        label: 'Rentals',
        icon: <CalendarCheck />,
        to: '/admin/rentals',
        staffTo: '/app/rentals',
        exact: false,
      },
      {
        type: 'link',
        label: 'Customers',
        to: '/admin/customers',
        staffTo: '/app/customers',
        icon: <Users />,
        exact: false,
      },
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
    label: 'Growth',
    items: [
      {
        type: 'link',
        label: 'Reports',
        to: '/admin/reports',
        icon: <BarChart3 />,
        exact: false,
        ownerOnly: true,
      },
      {
        type: 'link',
        label: 'Promo codes',
        icon: <Tag />,
        to: '/admin/promos',
        exact: false,
        ownerOnly: true,
      },
      {
        type: 'placeholder',
        label: 'Affiliates',
        icon: <Users />,
      },
    ],
  },
  {
    label: 'Team',
    items: [{ type: 'placeholder', label: 'Staff', icon: <Users /> }],
  },
  {
    label: 'System',
    items: [
      {
        type: 'link',
        label: 'Settings',
        icon: <Settings />,
        to: '/admin/settings',
        exact: false,
        ownerOnly: true,
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

type AdminSidebarShellProps = {
  children: ReactNode
  pageTitle?: string
  user: { name: string; email: string; role?: AppRole | string }
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
                        <span className="admin-nav-soon">
                          soon
                        </span>
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
                  <SidebarMenuItem key={item.label}>
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

export default function AdminSidebarShell({
  children,
  user,
}: AdminSidebarShellProps) {
  const isOwner =
    user.role === 'owner' || user.role === 'super_admin' || !user.role
  const navSections = resolveAdminNavSections(NAV_SECTIONS, { isOwner })
  const now = new Date()
  const today = formatTopbarDate(now)
  const todayIso = now.toISOString().slice(0, 10)
  const displayName = user.name?.trim() || user.email

  const handleSignOut = async () => {
    await authClient.signOut()
    window.location.href = '/'
  }

  return (
    <TooltipProvider>
      <SidebarProvider
        className="cxq-light-surface admin-shell-layout min-h-svh"
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
        <Sidebar collapsible="icon" className="admin-sidebar-panel border-r border-[var(--line)]">
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
        </Sidebar>

        <SidebarInset className="admin-main-canvas">
          <header className="admin-topbar sticky top-0 z-10 flex items-center gap-2.5 border-b border-[var(--line)] px-3 md:px-5">
            <SidebarTrigger
              className="-ml-0.5 size-8 text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
              aria-label="Toggle sidebar"
            />
            <div className="admin-topbar-meta min-w-0 flex-1 truncate">
              <p className="truncate leading-tight">
                <span className="admin-topbar-user">{displayName}</span>
                <span className="mx-2 text-[var(--line)]" aria-hidden>
                  ·
                </span>
                <time dateTime={todayIso}>{today}</time>
              </p>
            </div>
            <div className="admin-topbar-actions flex shrink-0 items-center">
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
          <div className="admin-main-content flex min-w-0 flex-1 flex-col gap-0 p-3 md:p-5 lg:px-6 lg:py-5">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
