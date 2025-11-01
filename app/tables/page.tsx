"use client"

import { AppLayout } from "@/components/app-layout"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { CarOperatorsTable } from "@/components/tables/car-operators-table"
import { SalesChannelsTable } from "@/components/tables/sales-channels-table"
import { LocationsTable } from "@/components/tables/locations-table"
import { AddOnsTable } from "@/components/tables/add-ons-table"
import { CarBrandsTable } from "@/components/tables/car-brands-table"
import { PaymentMethodsTable } from "@/components/tables/payment-methods-table"
import { MaintenanceTypesTable } from "@/components/tables/maintenance-types-table"
import { TicketCategoriesTable } from "@/components/tables/ticket-categories-table"
import { useState } from "react"
import { Users, Store, MapPin, Package, Car, CreditCard, Wrench, Tag } from "lucide-react"

export default function TablesPage() {
  const [activeTab, setActiveTab] = useState("car-operators")

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 pb-24 lg:pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full h-auto grid grid-cols-4 gap-2 bg-muted/30 p-2 rounded-xl">
            <TabsTrigger
              value="car-operators"
              className="whitespace-normal text-center min-h-[3rem] px-4 py-2 text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex flex-col items-center gap-1"
            >
              <Users className="h-4 w-4" />
              <span>Car Operators</span>
            </TabsTrigger>
            <TabsTrigger
              value="sales-channels"
              className="whitespace-normal text-center min-h-[3rem] px-4 py-2 text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex flex-col items-center gap-1"
            >
              <Store className="h-4 w-4" />
              <span>Sales Channels</span>
            </TabsTrigger>
            <TabsTrigger
              value="locations"
              className="whitespace-normal text-center min-h-[3rem] px-4 py-2 text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex flex-col items-center gap-1"
            >
              <MapPin className="h-4 w-4" />
              <span>Locations</span>
            </TabsTrigger>
            <TabsTrigger
              value="add-ons"
              className="whitespace-normal text-center min-h-[3rem] px-4 py-2 text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex flex-col items-center gap-1"
            >
              <Package className="h-4 w-4" />
              <span>Add-ons</span>
            </TabsTrigger>
            <TabsTrigger
              value="car-brands"
              className="whitespace-normal text-center min-h-[3rem] px-4 py-2 text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex flex-col items-center gap-1"
            >
              <Car className="h-4 w-4" />
              <span>Car Brands</span>
            </TabsTrigger>
            <TabsTrigger
              value="payment-methods"
              className="whitespace-normal text-center min-h-[3rem] px-4 py-2 text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex flex-col items-center gap-1"
            >
              <CreditCard className="h-4 w-4" />
              <span>Payment</span>
            </TabsTrigger>
            <TabsTrigger
              value="maintenance-types"
              className="whitespace-normal text-center min-h-[3rem] px-4 py-2 text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex flex-col items-center gap-1"
            >
              <Wrench className="h-4 w-4" />
              <span>Service Types</span>
            </TabsTrigger>
            <TabsTrigger
              value="ticket-categories"
              className="whitespace-normal text-center min-h-[3rem] px-4 py-2 text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex flex-col items-center gap-1"
            >
              <Tag className="h-4 w-4" />
              <span>Ticket Types</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="car-operators" className="mt-6">
            <CarOperatorsTable />
          </TabsContent>

          <TabsContent value="sales-channels" className="mt-6">
            <SalesChannelsTable />
          </TabsContent>

          <TabsContent value="locations" className="mt-6">
            <LocationsTable />
          </TabsContent>

          <TabsContent value="add-ons" className="mt-6">
            <AddOnsTable />
          </TabsContent>

          <TabsContent value="car-brands" className="mt-6">
            <CarBrandsTable />
          </TabsContent>

          <TabsContent value="payment-methods" className="mt-6">
            <PaymentMethodsTable />
          </TabsContent>

          <TabsContent value="maintenance-types" className="mt-6">
            <MaintenanceTypesTable />
          </TabsContent>

          <TabsContent value="ticket-categories" className="mt-6">
            <TicketCategoriesTable />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
