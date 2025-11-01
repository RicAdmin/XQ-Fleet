"use client"

import { AppLayout } from "@/components/app-layout"
import { CarOperatorsTable } from "@/components/tables/car-operators-table"

export default function CarOperatorsPage() {
  return (
    <AppLayout>
      <CarOperatorsTable />
    </AppLayout>
  )
}
