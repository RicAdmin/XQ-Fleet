import { Outlet, createFileRoute } from '@tanstack/react-router'

import { getCustomerBookings, getPortalCustomerProfile } from '#/lib/portal-booking-functions'
import { requireSurfaceAccess } from '#/lib/route-guards'

export const Route = createFileRoute('/account')({
  beforeLoad: async () => requireSurfaceAccess('account'),
  loader: async () => {
    const [bookings, portalCustomer] = await Promise.all([
      getCustomerBookings(),
      getPortalCustomerProfile(),
    ])
    return { bookings, portalCustomer }
  },
  component: CustomerAccountOutlet,
})

function CustomerAccountOutlet() {
  return <Outlet />
}
