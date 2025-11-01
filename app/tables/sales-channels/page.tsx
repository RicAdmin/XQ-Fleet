"use client"

import { AppLayout } from "@/components/app-layout"
import { SalesChannelsTable } from "@/components/tables/sales-channels-table"

export default function SalesChannelsPage() {
  return (
    <AppLayout>
      <SalesChannelsTable />
    </AppLayout>
  )
}
