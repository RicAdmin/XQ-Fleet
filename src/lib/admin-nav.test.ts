import { describe, expect, it } from 'vitest'

import { INTERNAL_JOBS_PATH } from '#/lib/internal-routes'

import {
  resolveAdminNavSections,
  type AdminNavSection,
} from './admin-nav'

const SECTIONS: AdminNavSection<string>[] = [
  {
    label: 'Manage',
    audiences: ['customer_service', 'operations', 'admin'],
    items: [
      {
        type: 'link',
        label: 'Operation',
        icon: 'ops',
        to: '/admin/operations',
        exact: false,
        audiences: ['operations', 'admin'],
      },
      {
        type: 'link',
        label: 'Job',
        icon: 'job',
        to: INTERNAL_JOBS_PATH,
        exact: false,
      },
      {
        type: 'link',
        label: 'Availability',
        icon: 'avail',
        to: '/admin/availability',
        exact: false,
      },
      {
        type: 'link',
        label: 'Payment',
        icon: 'pay',
        to: '/admin/payments',
        exact: false,
      },
      {
        type: 'link',
        label: 'Customer',
        icon: 'cust',
        to: '/admin/customers',
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
        icon: 'maint',
        to: '/admin/maintenance',
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
        label: 'Reports',
        icon: 'reports',
        to: '/admin/reports',
        exact: false,
      },
      {
        type: 'link',
        label: 'Promo code',
        icon: 'promo',
        to: '/admin/promos',
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
        label: 'Vehicle',
        icon: 'vehicle',
        to: '/admin/cars',
        exact: false,
      },
      {
        type: 'link',
        label: 'Partner',
        icon: 'partner',
        to: '/admin/partners',
        exact: false,
      },
      {
        type: 'link',
        label: 'Location',
        icon: 'loc',
        to: '/admin/locations',
        exact: false,
      },
      {
        type: 'link',
        label: 'Staff',
        icon: 'staff',
        to: '/admin/staff',
        exact: false,
      },
    ],
  },
]

describe('resolveAdminNavSections', () => {
  it('shows CS manage items without operation or maintenance', () => {
    const resolved = resolveAdminNavSections(SECTIONS, { persona: 'customer_service' })
    expect(resolved.map((s) => s.label)).toEqual(['Manage'])
    expect(resolved[0]?.items.map((i) => i.label)).toEqual([
      'Job',
      'Availability',
      'Payment',
      'Customer',
    ])
  })

  it('shows ops manage + maintenance without insight/config', () => {
    const resolved = resolveAdminNavSections(SECTIONS, { persona: 'operations' })
    expect(resolved.map((s) => s.label)).toEqual(['Manage', 'Maintenance'])
    const manage = resolved.find((s) => s.label === 'Manage')
    expect(manage?.items.map((i) => i.label)).toEqual([
      'Operation',
      'Job',
      'Availability',
      'Payment',
    ])
  })

  it('shows full admin menus including insight and configuration', () => {
    const resolved = resolveAdminNavSections(SECTIONS, { persona: 'admin' })
    expect(resolved.map((s) => s.label)).toEqual([
      'Manage',
      'Maintenance',
      'Insight',
      'Configuration',
    ])
  })
})
