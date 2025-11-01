"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { EnhancedMetricCards } from "@/components/enhanced-metric-cards"
import { AnalyticsOccupancyChart } from "@/components/analytics-occupancy-chart"
import { AnalyticsFleetStatusChart } from "@/components/analytics-fleet-status-chart"
import { TopCarsTable } from "@/components/top-cars-table"
import { TopIdleCarsTable } from "@/components/top-idle-cars-table"
import { LocationStatsChart } from "@/components/location-stats-chart"
import { RentalDurationStats } from "@/components/rental-duration-stats"
import { CustomerAnalyticsCard } from "@/components/customer-analytics-card"
import { BookingTypeChart } from "@/components/booking-type-chart"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Clock, TrendingUp, Eye } from "lucide-react"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"

export function AnalyticsDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(2024, 0, 1),
    to: new Date(),
  })

  const setThisWeek = () => {
    const now = new Date()
    setDateRange({
      from: startOfWeek(now, { weekStartsOn: 1 }),
      to: endOfWeek(now, { weekStartsOn: 1 }),
    })
  }

  const setThisMonth = () => {
    const now = new Date()
    setDateRange({
      from: startOfMonth(now),
      to: endOfMonth(now),
    })
  }

  const setThisYear = () => {
    const now = new Date()
    setDateRange({
      from: startOfYear(now),
      to: endOfYear(now),
    })
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 pb-24 lg:pb-6">
      {/* Filter Controls */}
      <Card className="rounded-xl p-4 glass-card border-white/40">
        <CardContent className="pt-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground min-w-[90px]">Date Range:</span>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Start Date Picker */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-[160px] justify-start text-left font-normal bg-transparent"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? format(dateRange.from, "MMM dd, yyyy") : "Start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
                      />
                    </PopoverContent>
                  </Popover>

                  <span className="text-muted-foreground">to</span>

                  {/* End Date Picker */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-[160px] justify-start text-left font-normal bg-transparent"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.to ? format(dateRange.to, "MMM dd, yyyy") : "End date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) => date && setDateRange({ ...dateRange, to: date })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Quick Select Buttons */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground min-w-[90px]">Quick Select:</span>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={setThisWeek} className="bg-transparent">
                    This Week
                  </Button>
                  <Button variant="outline" size="sm" onClick={setThisMonth} className="bg-transparent">
                    This Month
                  </Button>
                  <Button variant="outline" size="sm" onClick={setThisYear} className="bg-transparent">
                    This Year
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button className="bg-[#2663EB] hover:bg-[#2663EB]/90">Apply Filters</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <EnhancedMetricCards />

      <CustomerAnalyticsCard />

      <Card className="rounded-xl glass-card border-white/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Extended Hours Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total Extensions</p>
              <p className="text-2xl font-semibold">47</p>
              <p className="text-xs text-green-600">+12% from last period</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Extension Revenue</p>
              <p className="text-2xl font-semibold">RM 8,450</p>
              <p className="text-xs text-green-600">+18% from last period</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Avg Extension Hours</p>
              <p className="text-2xl font-semibold">4.2 hrs</p>
              <p className="text-xs text-muted-foreground">Per extension</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl glass-card border-white/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Sales Channel Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { channel: "WhatsApp", count: 145, revenue: "RM 87,500", percentage: 35 },
              { channel: "Website", count: 98, revenue: "RM 62,300", percentage: 24 },
              { channel: "Walk-in", count: 76, revenue: "RM 48,200", percentage: 18 },
              { channel: "Phone", count: 54, revenue: "RM 34,100", percentage: 13 },
              { channel: "WeChat", count: 28, revenue: "RM 17,800", percentage: 7 },
              { channel: "Social", count: 12, revenue: "RM 7,600", percentage: 3 },
            ].map((item) => (
              <div key={item.channel} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{item.channel}</span>
                    <span className="text-sm text-muted-foreground">{item.count} jobs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-[#2663EB]" style={{ width: `${item.percentage}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-16 text-right">{item.revenue}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl glass-card border-white/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Page Views Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Client Portal</p>
              <p className="text-2xl font-semibold">2,847</p>
              <p className="text-xs text-green-600">+24% views</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Benefits Page</p>
              <p className="text-2xl font-semibold">1,523</p>
              <p className="text-xs text-green-600">+15% views</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Rewards Page</p>
              <p className="text-2xl font-semibold">892</p>
              <p className="text-xs text-green-600">+8% views</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Safety & Support</p>
              <p className="text-2xl font-semibold">654</p>
              <p className="text-xs text-green-600">+12% views</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Type Distribution chart */}
      <Card className="rounded-xl glass-card border-white/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Job Distribution by Booking Type</CardTitle>
        </CardHeader>
        <CardContent>
          <BookingTypeChart />
        </CardContent>
      </Card>

      <LocationStatsChart />

      <RentalDurationStats />

      {/* Fleet Analytics Section */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-xl glass-card border-white/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Occupancy Rate Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsOccupancyChart />
          </CardContent>
        </Card>

        <Card className="rounded-xl glass-card border-white/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Fleet Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsFleetStatusChart />
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl glass-card border-white/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Top 10 Cars by Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <TopCarsTable />
        </CardContent>
      </Card>

      <Card className="rounded-xl glass-card border-white/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Top 10 Cars by Idle Days</CardTitle>
        </CardHeader>
        <CardContent>
          <TopIdleCarsTable />
        </CardContent>
      </Card>
    </div>
  )
}
