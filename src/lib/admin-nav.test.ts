import { describe, expect, it } from 'vitest'

import {
  resolveAdminNavSections,
  type AdminNavSection,
} from './admin-nav'

const SECTIONS: AdminNavSection<string>[] = [
  {
    label: 'Overview',
    items: [
      {
        type: 'link',
        label: 'Dashboard',
        icon: 'dash',
        to: '/admin/',
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
        icon: 'car',
        to: '/admin/cars',
        exact: false,
      },
      {
        type: 'link',
        label: 'Rentals',
        icon: 'rentals',
        to: '/admin/rentals',
        staffTo: '/app/rentals',
        exact: false,
      },
      {
        type: 'link',
        label: 'Customers',
        icon: 'customers',
        to: '/admin/customers',
        staffTo: '/app/customers',
        exact: false,
      },
    ],
  },
  {
    label: 'Team',
    items: [{ type: 'placeholder', label: 'Staff', icon: 'staff' }],
  },
]

describe('resolveAdminNavSections', () => {
  it('keeps ownerOnly items for an owner session', () => {
    const resolved = resolveAdminNavSections(SECTIONS, { isOwner: true })
    const overview = resolved.find((s) => s.label === 'Overview')
    expect(overview?.items).toEqual([
      {
        type: 'link',
        label: 'Dashboard',
        icon: 'dash',
        href: '/admin/',
        exact: true,
      },
    ])
  })

  it('omits ownerOnly items for a staff session', () => {
    const resolved = resolveAdminNavSections(SECTIONS, { isOwner: false })
    expect(resolved.find((s) => s.label === 'Overview')).toBeUndefined()
    const fleet = resolved.find((s) => s.label === 'Fleet')
    expect(fleet?.items.map((i) => i.label)).toEqual([
      'Vehicles',
      'Rentals',
      'Customers',
    ])
  })

  it('resolves to vs staffTo by role', () => {
    const forOwner = resolveAdminNavSections(SECTIONS, { isOwner: true })
    const forStaff = resolveAdminNavSections(SECTIONS, { isOwner: false })

    const ownerRentals = forOwner
      .flatMap((s) => s.items)
      .find((i) => i.type === 'link' && i.label === 'Rentals')
    const staffRentals = forStaff
      .flatMap((s) => s.items)
      .find((i) => i.type === 'link' && i.label === 'Rentals')

    expect(ownerRentals).toMatchObject({
      type: 'link',
      href: '/admin/rentals',
    })
    expect(staffRentals).toMatchObject({
      type: 'link',
      href: '/app/rentals',
    })
  })

  it('never treats a placeholder as a navigable link', () => {
    for (const isOwner of [true, false]) {
      const resolved = resolveAdminNavSections(SECTIONS, { isOwner })
      const staff = resolved
        .flatMap((s) => s.items)
        .find((i) => i.label === 'Staff')
      expect(staff).toEqual({
        type: 'placeholder',
        label: 'Staff',
        icon: 'staff',
      })
      expect(staff && 'href' in staff).toBe(false)
    }
  })
})
