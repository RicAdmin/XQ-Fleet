"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Car, KeyRound, Wrench, CheckCircle, AlertTriangle, MapPin, TrendingUp, Grid3x3 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { ExtendHourRequestsTable } from "@/components/extend-hour-requests-table"

export function Dashboard() {
  // Mock data for dashboard
  const fleetStats = {
    totalCars: 39,
    available: 12,
    rented: 22,
    maintenance: 5,
  }

  const todayJobs = [
    {
      id: "1",
      jobId: "JOB-2025-001",
      customer: "Sarah Johnson",
      car: "Toyota Vios 3G",
      carImage: "/toyota-vios-3g.png",
      plate: "TOY-1234",
      pickupTime: "09:00 AM",
      returnTime: "06:00 PM",
      status: "Active",
      location: "Kuala Lumpur",
    },
    {
      id: "2",
      jobId: "JOB-2025-002",
      customer: "Michael Chen",
      car: "Perodua Alza",
      carImage: "/perodua-alza.png",
      plate: "PER-5678",
      pickupTime: "10:30 AM",
      returnTime: "05:00 PM",
      status: "Pending Pickup",
      location: "Petaling Jaya",
    },
    {
      id: "3",
      jobId: "JOB-2025-003",
      customer: "David Wilson",
      car: "Toyota Innova",
      carImage: "/toyota-innova.png",
      plate: "TOY-9012",
      pickupTime: "02:00 PM",
      returnTime: "08:00 PM",
      status: "Reserved",
      location: "Subang Jaya",
    },
  ]

  const recentTickets = [
    {
      id: "1",
      ticketId: "TKT-2025-001",
      carPlate: "WXY 1234",
      carModel: "Toyota Camry",
      carImage: "/toyota-camry-sedan.png",
      type: "Accident",
      severity: "High",
      status: "Open",
      createdDate: "2025-01-09",
    },
    {
      id: "2",
      ticketId: "TKT-2025-002",
      carPlate: "ABC 5678",
      carModel: "Honda Odyssey",
      carImage: "/honda-odyssey-mpv.jpg",
      type: "Extend Hour",
      severity: "Low",
      status: "Resolved",
      createdDate: "2025-01-08",
    },
    {
      id: "3",
      ticketId: "TKT-2025-003",
      carPlate: "DEF 9012",
      carModel: "Ford Explorer",
      carImage: "/ford-explorer-suv.jpg",
      type: "Complaint",
      severity: "Medium",
      status: "In Review",
      createdDate: "2025-01-07",
    },
  ]

  const categoryStats = [
    { category: "Sedan", total: 15, available: 5, rented: 8, maintenance: 2 },
    { category: "SUV", total: 10, available: 3, rented: 6, maintenance: 1 },
    { category: "MPV", total: 8, available: 2, rented: 5, maintenance: 1 },
    { category: "Hatchback", total: 6, available: 2, rented: 3, maintenance: 1 },
  ]

  const locationStats = [
    { location: "Kuala Lumpur", total: 15, available: 5, rented: 8, maintenance: 2 },
    { location: "Petaling Jaya", total: 12, available: 4, rented: 7, maintenance: 1 },
    { location: "Subang Jaya", total: 8, available: 2, rented: 5, maintenance: 1 },
    { location: "Shah Alam", total: 4, available: 1, rented: 2, maintenance: 1 },
  ]

  const statusColors: Record<string, string> = {
    Active: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
    "Pending Pickup": "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
    Reserved: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  }

  const ticketStatusColors: Record<string, string> = {
    Open: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
    "In Review": "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    Resolved: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  }

  const severityColors: Record<string, string> = {
    High: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
    Medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    Low: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  }

  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-border/40">
        <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800 [mask-image:linear-gradient(0deg,transparent,black)] opacity-30" />
        <div className="relative px-4 sm:px-6 py-6 sm:py-8 lg:py-10">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 p-4 sm:p-5 shadow-lg border border-white/20 dark:border-slate-800/50 hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF8945]/5 rounded-full blur-3xl" />
                <div className="relative space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 sm:p-2.5 rounded-xl bg-[#FF8945]/10">
                      <Car className="h-4 w-4 sm:h-5 sm:w-5 text-[#FF8945]" />
                    </div>
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Fleet</p>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-0.5">{fleetStats.totalCars}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Active vehicles</p>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 p-4 sm:p-5 shadow-lg border border-white/20 dark:border-slate-800/50 hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-3xl" />
                <div className="relative space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 sm:p-2.5 rounded-xl bg-green-500/10">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    </div>
                    <div className="text-xs font-semibold text-green-600">
                      {Math.round((fleetStats.available / fleetStats.totalCars) * 100)}%
                    </div>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Available</p>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-0.5">{fleetStats.available}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Ready to rent</p>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 p-4 sm:p-5 shadow-lg border border-white/20 dark:border-slate-800/50 hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-3xl" />
                <div className="relative space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 sm:p-2.5 rounded-xl bg-blue-500/10">
                      <KeyRound className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <div className="text-xs font-semibold text-blue-600">
                      {Math.round((fleetStats.rented / fleetStats.totalCars) * 100)}%
                    </div>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Rented</p>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-0.5">{fleetStats.rented}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Active rentals</p>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 p-4 sm:p-5 shadow-lg border border-white/20 dark:border-slate-800/50 hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-3xl" />
                <div className="relative space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/10">
                      <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                    </div>
                    <div className="text-xs font-semibold text-amber-600">
                      {Math.round((fleetStats.maintenance / fleetStats.totalCars) * 100)}%
                    </div>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Maintenance</p>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-0.5">{fleetStats.maintenance}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">In service</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <Card className="glass-card rounded-2xl shadow-xl border-white/20 overflow-hidden">
            <CardHeader className="pb-4 sm:pb-5 bg-gradient-to-br from-slate-50/50 to-transparent dark:from-slate-900/50 p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 rounded-xl bg-[#FF8945]/10">
                  <Grid3x3 className="h-4 w-4 sm:h-5 sm:w-5 text-[#FF8945]" />
                </div>
                <CardTitle className="text-lg sm:text-xl font-bold">Fleet by Category</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2.5 sm:space-y-3">
                {categoryStats.map((cat, index) => (
                  <div
                    key={index}
                    className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 hover:from-muted/50 hover:to-muted/20 transition-all duration-300 border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="font-bold text-sm sm:text-base truncate">{cat.category}</div>
                      <div className="text-xs sm:text-sm font-bold flex-shrink-0 ml-2">{cat.total} cars</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 text-xs">
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-green-500 flex-shrink-0" />
                        <span className="text-muted-foreground truncate">Avail:</span>
                        <span className="font-bold">{cat.available}</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-blue-500 flex-shrink-0" />
                        <span className="text-muted-foreground truncate">Rent:</span>
                        <span className="font-bold">{cat.rented}</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                        <span className="text-muted-foreground truncate">Maint:</span>
                        <span className="font-bold">{cat.maintenance}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card rounded-2xl shadow-xl border-white/20 overflow-hidden">
            <CardHeader className="pb-4 sm:pb-5 bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-950/20 p-4 sm:p-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 rounded-xl bg-red-500/10">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl font-bold">Recent Tickets</CardTitle>
                </div>
                <Link href="/tickets">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#FF8945] hover:text-[#FF8945]/80 hover:bg-[#FF8945]/10 font-semibold h-9"
                  >
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2.5 sm:space-y-3">
                {recentTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="group flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 hover:from-muted/50 hover:to-muted/20 transition-all duration-300 border border-border/50"
                  >
                    <div className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-lg overflow-hidden bg-muted ring-2 ring-border/50 flex-shrink-0">
                      <Image
                        src={ticket.carImage || "/placeholder.svg"}
                        alt={ticket.carModel}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-mono font-bold text-xs sm:text-sm text-[#FF8945] truncate">
                            {ticket.ticketId}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">{ticket.carPlate}</div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`${ticketStatusColors[ticket.status]} font-semibold text-[10px] sm:text-xs flex-shrink-0`}
                        >
                          {ticket.status}
                        </Badge>
                      </div>
                      <div className="text-xs sm:text-sm font-medium truncate">{ticket.carModel}</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px] sm:text-xs font-medium">
                          {ticket.type}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`${severityColors[ticket.severity]} text-[10px] sm:text-xs font-medium`}
                        >
                          {ticket.severity}
                        </Badge>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          {new Date(ticket.createdDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <ExtendHourRequestsTable />

        <Card className="glass-card rounded-2xl shadow-xl border-white/20 overflow-hidden">
          <CardHeader className="pb-4 sm:pb-5 bg-gradient-to-br from-slate-50/50 to-transparent dark:from-slate-900/50 p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 rounded-xl bg-[#FF8945]/10">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-[#FF8945]" />
              </div>
              <CardTitle className="text-lg sm:text-xl font-bold">Fleet by Location</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-2.5 sm:space-y-3">
              {locationStats.map((loc, index) => (
                <div
                  key={index}
                  className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 hover:from-muted/50 hover:to-muted/20 transition-all duration-300 border border-border/50"
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="font-bold text-sm sm:text-base truncate">{loc.location}</div>
                    <div className="text-xs sm:text-sm font-bold flex-shrink-0 ml-2">{loc.total} cars</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 text-xs">
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-green-500 flex-shrink-0" />
                      <span className="text-muted-foreground truncate">Avail:</span>
                      <span className="font-bold">{loc.available}</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-blue-500 flex-shrink-0" />
                      <span className="text-muted-foreground truncate">Rent:</span>
                      <span className="font-bold">{loc.rented}</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                      <span className="text-muted-foreground truncate">Maint:</span>
                      <span className="font-bold">{loc.maintenance}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
