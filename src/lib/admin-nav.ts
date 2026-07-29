/**
 * Pure owner/staff nav resolution for the admin sidebar.
 * No React/DOM dependencies — safe to unit-test in isolation.
 */

import type { DashboardPersona } from '#/lib/auth-model'

export type AdminNavLinkTo =
  | '/admin'
  | '/admin/'
  | '/admin/cars'
  | '/admin/car-models'
  | '/admin/customers'
  | '/admin/rentals'
  | '/internal/jobs'
  | '/internal/dashboard'
  | '/admin/settings'
  | '/admin/promos'
  | '/admin/affiliates'
  | '/admin/reports'
  | '/admin/operations'
  | '/admin/payments'
  | '/admin/availability'
  | '/admin/locations'
  | '/admin/staff'
  | '/admin/partners'
  | '/admin/maintenance'
  | '/admin/accounts'
  | '/app/customers'
  | '/app/rentals'

/** Which dashboard personas see this nav item. */
export type AdminNavAudience = DashboardPersona

export type AdminNavLinkItem<TIcon = unknown> = {
  type: 'link'
  label: string
  icon: TIcon
  to: AdminNavLinkTo
  exact: boolean
  /** Visible only to these personas. Omit = all personas. */
  audiences?: ReadonlyArray<AdminNavAudience>
}

export type AdminNavPlaceholderItem<TIcon = unknown> = {
  type: 'placeholder'
  label: string
  icon: TIcon
  audiences?: ReadonlyArray<AdminNavAudience>
}

export type AdminNavSectionItem<TIcon = unknown> =
  | AdminNavLinkItem<TIcon>
  | AdminNavPlaceholderItem<TIcon>

export type AdminNavSection<TIcon = unknown> = {
  label: string
  items: AdminNavSectionItem<TIcon>[]
  audiences?: ReadonlyArray<AdminNavAudience>
}

export type ResolvedAdminNavLink<TIcon = unknown> = {
  type: 'link'
  label: string
  icon: TIcon
  href: AdminNavLinkTo
  exact: boolean
}

export type ResolvedAdminNavPlaceholder<TIcon = unknown> = {
  type: 'placeholder'
  label: string
  icon: TIcon
}

export type ResolvedAdminNavItem<TIcon = unknown> =
  | ResolvedAdminNavLink<TIcon>
  | ResolvedAdminNavPlaceholder<TIcon>

export type ResolvedAdminNavSection<TIcon = unknown> = {
  label: string
  items: ResolvedAdminNavItem<TIcon>[]
}

export type ResolveAdminNavOptions = {
  persona: DashboardPersona
}

function matchesAudience(
  audiences: ReadonlyArray<AdminNavAudience> | undefined,
  persona: DashboardPersona,
): boolean {
  if (!audiences || audiences.length === 0) return true
  return audiences.includes(persona)
}

/**
 * Filters nav sections/items by dashboard persona (CS, Ops, or full admin).
 */
export function resolveAdminNavSections<TIcon>(
  sections: AdminNavSection<TIcon>[],
  { persona }: ResolveAdminNavOptions,
): ResolvedAdminNavSection<TIcon>[] {
  return sections
    .filter((section) => matchesAudience(section.audiences, persona))
    .map((section) => {
      const items: ResolvedAdminNavItem<TIcon>[] = []

      for (const item of section.items) {
        if (!matchesAudience(item.audiences, persona)) continue

        if (item.type === 'placeholder') {
          items.push({
            type: 'placeholder',
            label: item.label,
            icon: item.icon,
          })
          continue
        }

        items.push({
          type: 'link',
          label: item.label,
          icon: item.icon,
          href: item.to,
          exact: item.exact,
        })
      }

      return { label: section.label, items }
    })
    .filter((section) => section.items.length > 0)
}
