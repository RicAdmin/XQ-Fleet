"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, TrendingUp, DollarSign, Star } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"

const customerData = [
  { month: "Jan", newCustomers: 12, returningCustomers: 45 },
  { month: "Feb", newCustomers: 15, returningCustomers: 52 },
  { month: "Mar", newCustomers: 18, returningCustomers: 58 },
  { month: "Apr", newCustomers: 22, returningCustomers: 65 },
  { month: "May", newCustomers: 20, returningCustomers: 70 },
  { month: "Jun", newCustomers: 25, returningCustomers: 75 },
]

const topCustomers = [
  { name: "Ahmad Hassan", jobs: 12, revenue: "RM 8,400" },
  { name: "Emily Wong", jobs: 15, revenue: "RM 10,500" },
  { name: "Sarah Lee", jobs: 8, revenue: "RM 5,600" },
  { name: "John Tan", jobs: 5, revenue: "RM 3,500" },
  { name: "Michael Lim", jobs: 3, revenue: "RM 2,100" },
]

export function CustomerAnalyticsCard() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
      {/* Total Customers */}
      <Card className="rounded-xl glass-card border-white/40">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">248</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-600">+12%</span> from last month
          </p>
        </CardContent>
      </Card>

      {/* New Customers This Month */}
      <Card className="rounded-xl glass-card border-white/40">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">New This Month</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">25</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-600">+8%</span> from last month
          </p>
        </CardContent>
      </Card>

      {/* Average Revenue Per Customer */}
      <Card className="rounded-xl glass-card border-white/40">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Revenue/Customer</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">RM 4,250</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-600">+5%</span> from last month
          </p>
        </CardContent>
      </Card>

      {/* Customer Retention Rate */}
      <Card className="rounded-xl glass-card border-white/40">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">78%</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-600">+3%</span> from last month
          </p>
        </CardContent>
      </Card>

      {/* Customer Growth Chart */}
      <Card className="rounded-xl glass-card border-white/40 md:col-span-2 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Customer Growth Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={customerData}>
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="newCustomers" fill="#FF8945" name="New Customers" />
              <Bar dataKey="returningCustomers" fill="#2663EB" name="Returning" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Customers */}
      <Card className="rounded-xl glass-card border-white/40 md:col-span-2 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Top 5 Customers by Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topCustomers.map((customer, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">{customer.jobs} jobs</p>
                  </div>
                </div>
                <p className="text-sm font-semibold">{customer.revenue}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
