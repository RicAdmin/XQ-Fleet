"use client"

import { AppLayout } from "@/components/app-layout"
import { LocationsTable } from "@/components/tables/locations-table"

export default function LocationsPage() {
  return (
    <AppLayout>
      <LocationsTable />
    </AppLayout>
  )
}
