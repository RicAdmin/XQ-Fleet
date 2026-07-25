import { useState } from 'react'

import { CalendarDays, KeyRound, Undo2 } from 'lucide-react'

import { BookingsTab } from '#/components/admin/BookingsTab'
import { PickupsTab } from '#/components/admin/PickupsTab'
import { ReturnsTab } from '#/components/admin/ReturnsTab'
import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { PageHeader } from '#/components/ui/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { getOperationsQueue, type OperationsQueue } from '#/lib/rental-functions'

type OperationTab = 'pickups' | 'returns' | 'bookings'

type AdminOperationsProps = {
  session: { user: { name: string; email: string; role: string } }
  initialQueue: OperationsQueue
}

export default function AdminOperations({ session, initialQueue }: AdminOperationsProps) {
  const [queue, setQueue] = useState(initialQueue)
  const [tab, setTab] = useState<OperationTab>('pickups')

  async function refreshQueue() {
    const next = await getOperationsQueue()
    setQueue(next)
  }

  return (
    <AdminSidebarShell user={session.user} pageTitle="Operation">
      <PageHeader
        title="Operation"
        description="Daily pickup and return workflows, plus booking activity."
      />

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as OperationTab)}
        className="gap-2.5 admin-operations-tabs"
      >
        <TabsList variant="pill" className="w-full max-w-xl">
          <TabsTrigger value="pickups">
            <KeyRound size={14} />
            Pickups ({queue.pickups.length})
          </TabsTrigger>
          <TabsTrigger value="returns">
            <Undo2 size={14} />
            Returns ({queue.returns.length})
          </TabsTrigger>
          <TabsTrigger value="bookings">
            <CalendarDays size={14} />
            Bookings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pickups" className="mt-0">
          <PickupsTab rows={queue.pickups} onMutated={refreshQueue} />
        </TabsContent>

        <TabsContent value="returns" className="mt-0">
          <ReturnsTab rows={queue.returns} onMutated={refreshQueue} />
        </TabsContent>

        <TabsContent value="bookings" className="mt-0">
          <BookingsTab />
        </TabsContent>
      </Tabs>
    </AdminSidebarShell>
  )
}
