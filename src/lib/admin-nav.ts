/**
 * Pure owner/staff nav resolution for the admin sidebar.
 * No React/DOM dependencies — safe to unit-test in isolation.
 */

export type AdminNavLinkTo =
  | '/admin'
  | '/admin/'
  | '/admin/cars'
  | '/admin/customers'
  | '/admin/rentals'
  | '/admin/settings'
  | '/admin/promos'
  | '/admin/reports'
  | '/admin/maintenance'
  | '/app/customers'
  | '/app/rentals'

export type AdminNavLinkItem<TIcon = unknown> = {
  type: 'link'
  label: string
  icon: TIcon
  to: AdminNavLinkTo
  /** Alternate path shown to staff (non-owner) instead of `to` */
  staffTo?: AdminNavLinkTo
  exact: boolean
  ownerOnly?: boolean
}

export type AdminNavPlaceholderItem<TIcon = unknown> = {
  type: 'placeholder'
  label: string
  icon: TIcon
}

export type AdminNavSectionItem<TIcon = unknown> =
  | AdminNavLinkItem<TIcon>
  | AdminNavPlaceholderItem<TIcon>

export type AdminNavSection<TIcon = unknown> = {
  label: string
  items: AdminNavSectionItem<TIcon>[]
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
  isOwner: boolean
}

/**
 * Filters `ownerOnly` items for non-owners, resolves `to` vs `staffTo`,
 * and leaves placeholders as non-navigable rows regardless of role.
 */
export function resolveAdminNavSections<TIcon>(
  sections: AdminNavSection<TIcon>[],
  { isOwner }: ResolveAdminNavOptions,
): ResolvedAdminNavSection<TIcon>[] {
  return sections
    .map((section) => {
      const items: ResolvedAdminNavItem<TIcon>[] = []

      for (const item of section.items) {
        if (item.type === 'placeholder') {
          items.push({
            type: 'placeholder',
            label: item.label,
            icon: item.icon,
          })
          continue
        }

        if (item.ownerOnly && !isOwner) continue

        items.push({
          type: 'link',
          label: item.label,
          icon: item.icon,
          href: item.staffTo && !isOwner ? item.staffTo : item.to,
          exact: item.exact,
        })
      }

      return { label: section.label, items }
    })
    .filter((section) => section.items.length > 0)
}
