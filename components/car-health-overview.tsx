"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Car,
  LayoutDashboard,
  CarFront,
  Settings,
  Menu,
  CalendarDays,
  Droplet,
  BarChart3,
  Wrench,
  ChevronRight,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { CarHealthGauge } from "@/components/car-health-gauge"
import { HealthTrendChart } from "@/components/health-trend-chart"
import { HealthParametersChart } from "@/components/health-parameters-chart"
import { CarPredictionCards } from "@/components/car-prediction-cards"
import { MaintenanceHistoryTabs } from "@/components/maintenance-history-tabs"
import { CarInsightsSummary } from "@/components/car-insights-summary"

// Mock data - in real app, this would come from API based on carId
const carData = {
  id: "1",
  name: "Toyota Camry",
  registration: "WKL 1234",
  category: "Sedan",
  image: "/toyota-camry-sedan.png",
  status: "rented",
  odometer: 87500,
  avgDailyMileage: 125,
  lastMaintenance: "2024-11-15",
  washInterval: 7,
  nextPredictedMaintenance: "2025-01-20",
  confidence: 92,
  healthScore: 68,
}

export function CarHealthOverview({ carId }: { carId: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-green-500 hover:bg-green-600">Available</Badge>
      case "rented":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Rented</Badge>
      case "maintenance":
        return <Badge className="bg-amber-500 hover:bg-amber-600">Maintenance</Badge>
      case "car-wash":
        return <Badge className="bg-teal-500 hover:bg-teal-600">Car Wash</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-sidebar border-r border-sidebar-border transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <Car className="h-6 w-6 text-sidebar-primary" />
          <span className="text-lg font-semibold text-sidebar-foreground">Langkawi Rentals</span>
        </div>
        <nav className="space-y-1 p-4">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/fleet">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <CarFront className="h-4 w-4" />
              Fleet Management
            </Button>
          </Link>
          <Link href="/bookings">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <CalendarDays className="h-4 w-4" />
              Booking Management
            </Button>
          </Link>
          <Link href="/car-wash">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Droplet className="h-4 w-4" />
              Car Wash
            </Button>
          </Link>
          <Link href="/maintenance">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Wrench className="h-4 w-4" />
              Predictive Maintenance
            </Button>
          </Link>
          <Link href="/analytics">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Button>
          </Link>
          <Link href="/settings">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:pl-64">
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-card px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/analytics" className="hover:text-foreground transition-colors">
              Analytics
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/maintenance" className="hover:text-foreground transition-colors">
              Car Health
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">{carData.name}</span>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6 space-y-6">
          {/* Sticky Header with Car Name */}
          <div className="sticky top-16 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-6 px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{carData.name}</h1>
                <p className="text-sm text-muted-foreground">{carData.registration}</p>
              </div>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Download Report
              </Button>
            </div>
          </div>

          {/* Two-Column Layout */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Car Profile and Metrics */}
            <div className="space-y-6">
              {/* Car Summary Card */}
              <Card className="rounded-2xl shadow-lg">
                <CardHeader>
                  <CardTitle className="text-base font-medium">Car Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Image
                    src={carData.image || "/placeholder.svg"}
                    alt={carData.name}
                    width={300}
                    height={200}
                    className="rounded-lg object-cover w-full"
                  />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Model</span>
                      <span className="text-sm font-medium">{carData.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Registration</span>
                      <span className="text-sm font-medium">{carData.registration}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Category</span>
                      <span className="text-sm font-medium">{carData.category}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      {getStatusBadge(carData.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Current Odometer</span>
                      <span className="text-sm font-medium">{carData.odometer.toLocaleString()} km</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Avg Daily Mileage</span>
                      <span className="text-sm font-medium">{carData.avgDailyMileage} km/day</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Last Maintenance</span>
                      <span className="text-sm font-medium">{carData.lastMaintenance}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Wash Interval</span>
                      <span className="text-sm font-medium">{carData.washInterval} days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Next Maintenance</span>
                      <span className="text-sm font-medium">{carData.nextPredictedMaintenance}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Confidence</span>
                      <span className="text-sm font-medium">{carData.confidence}%</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 pt-4">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700">
                      <Wrench className="h-4 w-4 mr-2" />
                      Create Maintenance Task
                    </Button>
                    <Button variant="outline" className="w-full bg-transparent">
                      View Booking History
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Insights Summary */}
              <CarInsightsSummary />
            </div>

            {/* Right Column - Charts and History */}
            <div className="lg:col-span-2 space-y-6">
              {/* Car Health Index Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Car Health Index</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="rounded-2xl shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-base font-medium">Overall Health Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CarHealthGauge score={carData.healthScore} />
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-base font-medium">Health Score Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <HealthTrendChart />
                    </CardContent>
                  </Card>
                </div>
                <Card className="rounded-2xl shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-base font-medium">Top 5 Parameters Affecting Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <HealthParametersChart />
                  </CardContent>
                </Card>
              </div>

              {/* Predictive Maintenance Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Predictive Maintenance</h2>
                <CarPredictionCards />
              </div>

              {/* Maintenance & Usage History */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Maintenance & Usage History</h2>
                <MaintenanceHistoryTabs />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
