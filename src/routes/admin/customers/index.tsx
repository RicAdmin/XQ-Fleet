import { createFileRoute } from '@tanstack/react-router'

import CustomersList from '#/components/customers/CustomersList'
import {
  listCustomers,
  type CustomerListResult,
} from '#/lib/customer-functions'

const PAGE_SIZE = 25

export const Route = createFileRoute('/admin/customers/')({
  beforeLoad: async () => {
    const initialResult = await listCustomers({
      data: {
        page: 1,
        pageSize: PAGE_SIZE,
        accountFilter: 'all',
        sortKey: 'createdAt',
        sortDir: 'desc',
        includeAccountCounts: true,
      },
    })
    return {
      initialResult,
      initialAccountCounts: initialResult.accountCounts ?? {
        all: initialResult.total,
        linked: 0,
        'walk-in': 0,
      },
    }
  },
  component: AdminCustomersPage,
})

function AdminCustomersPage() {
  const { session, initialResult, initialAccountCounts } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
    initialResult: CustomerListResult
    initialAccountCounts: Record<'all' | 'linked' | 'walk-in', number>
  }
  return (
    <CustomersList
      session={session}
      basePath="/admin/customers"
      canDelete={true}
      initialResult={initialResult}
      initialAccountCounts={initialAccountCounts}
    />
  )
}
