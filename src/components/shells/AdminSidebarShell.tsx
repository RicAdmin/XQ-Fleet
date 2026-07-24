import type { CSSProperties, ReactNode } from 'react'

import { Link, useMatchRoute } from '@tanstack/react-router'
import {
  CalendarCheck,
  Car,
  LayoutDashboard,
  LogOut,
  Settings,
  Tag,
  Users,
} from 'lucide-react'

import BrandLogo from '#/components/BrandLogo'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { Badge } from '#/components/ui/badge'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
import { getRoleLabel } from '#/lib/auth-model'
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
    ],
  },
  {
    label: 'Growth',
    items: [
      {
        type: 'link',
        label: 'Promo codes',
        icon: <Tag />,
        to: '/admin/promos',
        exact: false,
        ownerOnly: true,
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
          <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {section.items.map((item) => {
                if (item.type === 'placeholder') {
                  return (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        disabled
                        tooltip={`${item.label} — coming soon`}
                        className="opacity-60"
                        aria-label={`${item.label} — coming soon`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                        <span className="ml-auto text-[10px] font-semibold tracking-wide uppercase text-muted-foreground">
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
                        'relative text-[var(--sea-ink)] no-underline hover:text-[var(--sea-ink)]',
                        isActive &&
                          'bg-[var(--ember-wash)] font-medium text-[var(--sea-ink)] shadow-[inset_3px_0_0_var(--ember)] hover:bg-[var(--ember-wash)] hover:text-[var(--sea-ink)] data-active:bg-[var(--ember-wash)] data-active:text-[var(--sea-ink)]',
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
  pageTitle = 'Dashboard',
  user,
}: AdminSidebarShellProps) {
  const initial = user.name.length > 0 ? user.name[0].toUpperCase() : 'A'
  const roleLabel = user.role ? getRoleLabel(user.role as AppRole) : 'Owner'
  const isOwner =
    user.role === 'owner' || user.role === 'super_admin' || !user.role
  const navSections = resolveAdminNavSections(NAV_SECTIONS, { isOwner })

  const handleSignOut = async () => {
    await authClient.signOut()
    window.location.href = '/'
  }

  return (
    <TooltipProvider>
      <SidebarProvider
        className="cxq-light-surface min-h-svh"
        style={
          {
            '--sidebar-width': '13.75rem',
            '--sidebar-width-icon': '3.5rem',
            '--sidebar': 'var(--surface-strong, #ffffff)',
            '--sidebar-foreground': 'var(--sea-ink, #14181a)',
            '--sidebar-accent': 'var(--ember-wash)',
            '--sidebar-accent-foreground': 'var(--sea-ink, #14181a)',
            '--sidebar-border': 'var(--line, #e4e6ea)',
            '--sidebar-ring': 'var(--ember)',
          } as CSSProperties
        }
      >
        <Sidebar collapsible="icon" className="border-r border-[var(--line)]">
          <SidebarHeader className="border-b border-[var(--line)]">
            <div className="flex items-center gap-2 px-1 py-1.5">
              <span className="flex size-8 shrink-0 items-center justify-center">
                <BrandLogo size={32} />
              </span>
              <span className="truncate font-[family-name:var(--font-display)] text-[0.95rem] font-semibold tracking-tight text-[var(--sea-ink)] group-data-[collapsible=icon]:hidden">
                XQCar
              </span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <AdminNavMenu sections={navSections} />
          </SidebarContent>

          <SidebarFooter className="border-t border-[var(--line)]">
            <div className="flex items-center gap-2 px-1 py-1 group-data-[collapsible=icon]:justify-center">
              <Avatar className="size-8">
                <AvatarFallback className="bg-[var(--ember-wash)] text-xs font-semibold text-[var(--ember-deep)]">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <p className="truncate text-sm font-medium text-[var(--sea-ink)]">
                  {user.name}
                </p>
                <p className="truncate text-xs text-[var(--sea-ink-soft)]">
                  {user.email}
                </p>
              </div>
            </div>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Sign out"
                  onClick={handleSignOut}
                  aria-label="Sign out"
                >
                  <LogOut />
                  <span>Sign out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset className="bg-[var(--bg-base,#f4f5f7)]">
          <header className="sticky top-0 z-10 flex h-[61px] items-center gap-3 border-b border-[var(--line)] bg-[var(--surface-strong,#ffffff)]/94 px-4 backdrop-blur-lg">
            <SidebarTrigger className="-ml-1" aria-label="Toggle sidebar" />
            <h1 className="flex-1 truncate font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--sea-ink)]">
              {pageTitle}
            </h1>
            <Badge
              variant="secondary"
              className="rounded-full bg-[var(--ember-wash)] text-[var(--ember-deep)]"
            >
              {roleLabel}
            </Badge>
          </header>
          <div className="flex flex-1 flex-col p-4 md:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
