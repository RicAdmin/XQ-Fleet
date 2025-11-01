"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Car,
  LayoutDashboard,
  CarFront,
  Settings,
  Menu,
  CalendarDays,
  Droplet,
  Wrench,
  ChevronRight,
  Download,
  Edit,
  MapPin,
  Gauge,
  Clock,
  CheckCircle2,
  ArrowUp,
  Activity,
  FileText,
  Plus,
} from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock data - in real app, this would come from API based on carId
const carData = {
  id: "1",
  registrationNo: "ABC-1234",
  make: "Toyota",
  model: "Camry",
  year: 2023,
  color: "Silver",
  category: "Sedan",
  status: "Available",
  location: "Airport CP",
  odometer: 87500,
  lastMaintenanceDate: "2024-11-15",
  lastWashDate: "2025-01-05",
  currentBooking: null,
  healthScore: 85,
  dailyRate: 45,
  photo: "/toyota-camry-sedan.png",
}

const utilizationData = [
  { month: "Aug", utilization: 65 },
  { month: "Sep", utilization: 72 },
  { month: "Oct", utilization: 68 },
  { month: "Nov", utilization: 78 },
  { month: "Dec", utilization: 82 },
  { month: "Jan", utilization: 75 },
]

const maintenanceRecords = [
  {
    id: 1,
    date: "2024-11-15",
    type: "Oil Change",
    cost: 120,
    description: "Regular oil change and filter replacement",
    status: "Completed",
  },
  {
    id: 2,
    date: "2024-09-20",
    type: "Tire Rotation",
    cost: 80,
    description: "Rotated all four tires",
    status: "Completed",
  },
  {
    id: 3,
    date: "2024-07-10",
    type: "Brake Inspection",
    cost: 150,
    description: "Inspected brake pads and rotors",
    status: "Completed",
  },
]

const maintenanceCostData = [
  { month: "Aug", cost: 120 },
  { month: "Sep", cost: 80 },
  { month: "Oct", cost: 0 },
  { month: "Nov", cost: 150 },
  { month: "Dec", cost: 0 },
  { month: "Jan", cost: 0 },
]

const washRecords = [
  { id: 1, date: "2025-01-05", vendor: "Clean Car Wash", cost: 25, status: "Completed" },
  { id: 2, date: "2024-12-28", vendor: "Quick Wash", cost: 20, status: "Completed" },
  { id: 3, date: "2024-12-20", vendor: "Clean Car Wash", cost: 25, status: "Completed" },
]

const healthScoreData = [
  { month: "Aug", score: 88 },
  { month: "Sep", score: 87 },
  { month: "Oct", score: 86 },
  { month: "Nov", score: 85 },
  { month: "Dec", score: 85 },
  { month: "Jan", score: 85 },
]

const activityTimeline = [
  {
    id: 1,
    type: "Pickup",
    customer: "Ahmad Hassan",
    timestamp: "2025-01-08 10:30 AM",
    staff: "Staff A",
  },
  {
    id: 2,
    type: "Return",
    customer: "Ahmad Hassan",
    timestamp: "2025-01-06 02:15 PM",
    staff: "Staff B",
  },
  {
    id: 3,
    type: "Wash",
    vendor: "Clean Car Wash",
    timestamp: "2025-01-05 09:00 AM",
    staff: "Staff C",
  },
  {
    id: 4,
    type: "Maintenance",
    description: "Oil Change",
    timestamp: "2024-11-15 11:00 AM",
    staff: "Staff D",
  },
]

const relatedTickets = [
  {
    id: "TKT2001AB",
    type: "Extend Hour",
    status: "Resolved",
    date: "2024-12-20",
  },
  {
    id: "TKT1998XY",
    type: "Complaint",
    status: "Resolved",
    date: "2024-11-10",
  },
]

const rentalHistory = [
  {
    id: 1,
    customer: "Ahmad Hassan",
    startDate: "2025-01-08",
    endDate: "2025-01-11",
    duration: "3 days",
    amount: 135,
    status: "Completed",
  },
  {
    id: 2,
    customer: "Sarah Lee",
    startDate: "2025-01-03",
    endDate: "2025-01-06",
    duration: "3 days",
    amount: 135,
    status: "Completed",
  },
  {
    id: 3,
    customer: "John Tan",
    startDate: "2024-12-28",
    endDate: "2024-12-31",
    duration: "3 days",
    amount: 135,
    status: "Completed",
  },
  {
    id: 4,
    customer: "Mary Wong",
    startDate: "2024-12-20",
    endDate: "2024-12-23",
    duration: "3 days",
    amount: 135,
    status: "Completed",
  },
  {
    id: 5,
    customer: "David Lim",
    startDate: "2024-12-15",
    endDate: "2024-12-18",
    duration: "3 days",
    amount: 135,
    status: "Completed",
  },
]

export function CarDetailView({ carId }: { carId: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editedCarData, setEditedCarData] = useState(carData)
  const router = useRouter()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Available":
        return <Badge className="bg-green-500 hover:bg-green-600 text-white">Available</Badge>
      case "Rented":
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Rented</Badge>
      case "Maintenance":
        return <Badge className="bg-orange-500 hover:bg-orange-600 text-white">Maintenance</Badge>
      case "Car Wash":
        return <Badge className="bg-teal-500 hover:bg-teal-600 text-white">Car Wash</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "Pickup":
        return <ArrowUp className="h-4 w-4 text-green-600" />
      case "Return":
        return <ArrowUp className="h-4 w-4 text-blue-600 rotate-180" />
      case "Wash":
        return <Droplet className="h-4 w-4 text-teal-600" />
      case "Maintenance":
        return <Wrench className="h-4 w-4 text-orange-600" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r border-border transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <Car className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold text-foreground">XQ Car</span>
        </div>
        <nav className="space-y-1 p-4">
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start gap-3 text-foreground hover:bg-muted">
              <LayoutDashboard className="h-4 w-4" />
              Home
            </Button>
          </Link>
          <Link href="/bookings">
            <Button variant="ghost" className="w-full justify-start gap-3 text-foreground hover:bg-muted">
              <CalendarDays className="h-4 w-4" />
              Orders
            </Button>
          </Link>
          <Link href="/fleet">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 bg-primary/10 text-primary hover:bg-primary/20"
            >
              <CarFront className="h-4 w-4" />
              Fleet
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="ghost" className="w-full justify-start gap-3 text-foreground hover:bg-muted">
              <Settings className="h-4 w-4" />
              Admin
            </Button>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:pl-64">
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-white/80 backdrop-blur-sm px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/fleet" className="hover:text-foreground transition-colors">
              Fleet
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">
              {editedCarData.make} {editedCarData.model}
            </span>
          </div>
          <div className="ml-auto">
            <Button variant="outline" className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Download Report
            </Button>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Two-Column Layout */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Car Summary & Quick Actions */}
            <div className="space-y-6">
              {/* Car Summary Card */}
              <Card className="rounded-2xl shadow-md">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-semibold">Car Summary</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (isEditMode) {
                        // Save changes
                        setIsEditMode(false)
                      } else {
                        setIsEditMode(true)
                      }
                    }}
                  >
                    {isEditMode ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Edit className="h-4 w-4" />}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="w-full aspect-[756/412] rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={editedCarData.photo || "/placeholder.svg"}
                      alt={`${editedCarData.make} ${editedCarData.model}`}
                      width={756}
                      height={412}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-3">
                    <div>
                      {isEditMode ? (
                        <div className="space-y-2">
                          <Input
                            value={editedCarData.make}
                            onChange={(e) => setEditedCarData({ ...editedCarData, make: e.target.value })}
                            className="font-bold text-xl"
                          />
                          <Input
                            value={editedCarData.model}
                            onChange={(e) => setEditedCarData({ ...editedCarData, model: e.target.value })}
                          />
                          <Input
                            value={editedCarData.registrationNo}
                            onChange={(e) => setEditedCarData({ ...editedCarData, registrationNo: e.target.value })}
                            className="font-mono text-sm"
                          />
                        </div>
                      ) : (
                        <>
                          <h3 className="text-xl font-bold">
                            {editedCarData.make} {editedCarData.model}
                          </h3>
                          <p className="text-sm text-muted-foreground font-mono">{editedCarData.registrationNo}</p>
                        </>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Color</p>
                        {isEditMode ? (
                          <Input
                            value={editedCarData.color}
                            onChange={(e) => setEditedCarData({ ...editedCarData, color: e.target.value })}
                            className="text-sm h-8"
                          />
                        ) : (
                          <p className="text-sm font-medium">{editedCarData.color}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Year</p>
                        {isEditMode ? (
                          <Input
                            type="number"
                            value={editedCarData.year}
                            onChange={(e) =>
                              setEditedCarData({ ...editedCarData, year: Number.parseInt(e.target.value) })
                            }
                            className="text-sm h-8"
                          />
                        ) : (
                          <p className="text-sm font-medium">{editedCarData.year}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Category</p>
                        {isEditMode ? (
                          <Select
                            value={editedCarData.category}
                            onValueChange={(value) => setEditedCarData({ ...editedCarData, category: value })}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Sedan">Sedan</SelectItem>
                              <SelectItem value="MPV">MPV</SelectItem>
                              <SelectItem value="SUV">SUV</SelectItem>
                              <SelectItem value="Hatchback">Hatchback</SelectItem>
                              <SelectItem value="Convertible">Convertible</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-sm font-medium">{editedCarData.category}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Status</p>
                        {getStatusBadge(editedCarData.status)}
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>Location</span>
                        </div>
                        {isEditMode ? (
                          <Input
                            value={editedCarData.location}
                            onChange={(e) => setEditedCarData({ ...editedCarData, location: e.target.value })}
                            className="text-sm h-8 w-32"
                          />
                        ) : (
                          <span className="text-sm font-medium">{editedCarData.location}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Gauge className="h-4 w-4" />
                          <span>Odometer</span>
                        </div>
                        {isEditMode ? (
                          <Input
                            type="number"
                            value={editedCarData.odometer}
                            onChange={(e) =>
                              setEditedCarData({ ...editedCarData, odometer: Number.parseInt(e.target.value) })
                            }
                            className="text-sm h-8 w-32"
                          />
                        ) : (
                          <span className="text-sm font-medium">{editedCarData.odometer.toLocaleString()} km</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Wrench className="h-4 w-4" />
                          <span>Last Maintenance</span>
                        </div>
                        <span className="text-sm font-medium">{editedCarData.lastMaintenanceDate}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Droplet className="h-4 w-4" />
                          <span>Last Wash</span>
                        </div>
                        <span className="text-sm font-medium">{editedCarData.lastWashDate}</span>
                      </div>
                      {editedCarData.currentBooking && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CalendarDays className="h-4 w-4" />
                            <span>Current Booking</span>
                          </div>
                          <span className="text-sm font-medium">{editedCarData.currentBooking}</span>
                        </div>
                      )}
                    </div>
                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Predictive Health Score</span>
                        <span className="text-sm font-bold text-primary">{editedCarData.healthScore}%</span>
                      </div>
                      <Progress value={editedCarData.healthScore} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {editedCarData.healthScore >= 80 ? "Excellent condition" : "Needs attention"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 pt-4">
                    <Button
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                      onClick={() => router.push("/maintenance")}
                    >
                      <Wrench className="h-4 w-4 mr-2" />
                      Send to Maintenance
                    </Button>
                    <Button
                      className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white"
                      onClick={() => router.push("/car-wash")}
                    >
                      <Droplet className="h-4 w-4 mr-2" />
                      Schedule Wash
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={() => router.push("/bookings")}
                    >
                      <CalendarDays className="h-4 w-4 mr-2" />
                      View Jobs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Tabs for Detailed Info */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-7 bg-muted/50 p-1 rounded-xl">
                  <TabsTrigger value="overview" className="rounded-lg">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="rental" className="rounded-lg">
                    Rental
                  </TabsTrigger>
                  <TabsTrigger value="maintenance" className="rounded-lg">
                    Maintenance
                  </TabsTrigger>
                  <TabsTrigger value="wash" className="rounded-lg">
                    Wash
                  </TabsTrigger>
                  <TabsTrigger value="health" className="rounded-lg">
                    Health
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="rounded-lg">
                    Activity
                  </TabsTrigger>
                  <TabsTrigger value="tickets" className="rounded-lg">
                    Tickets
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Card className="rounded-2xl shadow-md">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Past 30 Days</p>
                            <p className="text-2xl font-bold">12</p>
                            <p className="text-xs text-muted-foreground">Rentals</p>
                          </div>
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <CalendarDays className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="rounded-2xl shadow-md">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Avg Duration</p>
                            <p className="text-2xl font-bold">3.5</p>
                            <p className="text-xs text-muted-foreground">Days</p>
                          </div>
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-purple-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="rounded-2xl shadow-md">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold">Upcoming Bookings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                          <div>
                            <p className="text-sm font-medium">Ahmad Hassan</p>
                            <p className="text-xs text-muted-foreground">Jan 10 - Jan 13, 2025</p>
                          </div>
                          <Badge className="bg-blue-500 text-white">Confirmed</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                          <div>
                            <p className="text-sm font-medium">Sarah Lee</p>
                            <p className="text-xs text-muted-foreground">Jan 15 - Jan 18, 2025</p>
                          </div>
                          <Badge className="bg-yellow-500 text-white">Pending</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl shadow-md">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold">Utilization Over Last 6 Months</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={utilizationData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                          <YAxis stroke="#6b7280" fontSize={12} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e5e7eb",
                              borderRadius: "8px",
                            }}
                          />
                          <Line type="monotone" dataKey="utilization" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Rental History Tab */}
                <TabsContent value="rental" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Rental Transaction History</h3>
                    <div className="text-sm text-muted-foreground">
                      Total Rentals: <span className="font-semibold text-foreground">{rentalHistory.length}</span>
                    </div>
                  </div>

                  <Card className="rounded-2xl shadow-md">
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rentalHistory.map((rental) => (
                            <TableRow key={rental.id}>
                              <TableCell className="font-medium">{rental.customer}</TableCell>
                              <TableCell>{rental.startDate}</TableCell>
                              <TableCell>{rental.endDate}</TableCell>
                              <TableCell>{rental.duration}</TableCell>
                              <TableCell className="text-right font-semibold">${rental.amount}</TableCell>
                              <TableCell>
                                <Badge className="bg-green-500 text-white">{rental.status}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl shadow-md">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold">Revenue Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Revenue</p>
                          <p className="text-2xl font-bold">
                            ${rentalHistory.reduce((sum, rental) => sum + rental.amount, 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Average per Rental</p>
                          <p className="text-2xl font-bold">
                            $
                            {Math.round(
                              rentalHistory.reduce((sum, rental) => sum + rental.amount, 0) / rentalHistory.length,
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">This Month</p>
                          <p className="text-2xl font-bold">$270</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Maintenance Tab */}
                <TabsContent value="maintenance" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Maintenance History</h3>
                    <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Record
                    </Button>
                  </div>

                  <Card className="rounded-2xl shadow-md">
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Cost</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {maintenanceRecords.map((record) => (
                            <TableRow key={record.id}>
                              <TableCell>{record.date}</TableCell>
                              <TableCell className="font-medium">{record.type}</TableCell>
                              <TableCell>${record.cost}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{record.description}</TableCell>
                              <TableCell>
                                <Badge className="bg-green-500 text-white">{record.status}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl shadow-md">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold">Maintenance Cost Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={maintenanceCostData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                          <YAxis stroke="#6b7280" fontSize={12} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e5e7eb",
                              borderRadius: "8px",
                            }}
                          />
                          <Bar dataKey="cost" fill="#f97316" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Wash Tab */}
                <TabsContent value="wash" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Wash History</h3>
                    <Button className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule Wash
                    </Button>
                  </div>

                  <Card className="rounded-2xl shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Average Wash Interval</p>
                          <p className="text-2xl font-bold">8 days</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center">
                          <Droplet className="h-6 w-6 text-teal-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl shadow-md">
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Cost</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {washRecords.map((record) => (
                            <TableRow key={record.id}>
                              <TableCell>{record.date}</TableCell>
                              <TableCell className="font-medium">{record.vendor}</TableCell>
                              <TableCell>${record.cost}</TableCell>
                              <TableCell>
                                <Badge className="bg-green-500 text-white">{record.status}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Health Tab */}
                <TabsContent value="health" className="space-y-4">
                  <h3 className="text-lg font-semibold">Predictive Health Metrics</h3>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Card className="rounded-2xl shadow-md">
                      <CardContent className="p-6">
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Predicted Next Maintenance</p>
                          <p className="text-xl font-bold">Jan 20, 2025</p>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <p className="text-xs text-green-600">15 days away</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="rounded-2xl shadow-md">
                      <CardContent className="p-6">
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Confidence Level</p>
                          <p className="text-xl font-bold">92%</p>
                          <Progress value={92} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="rounded-2xl shadow-md">
                      <CardContent className="p-6">
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">KM Since Last Service</p>
                          <p className="text-xl font-bold">2,350 km</p>
                          <p className="text-xs text-muted-foreground">Target: 5,000 km</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="rounded-2xl shadow-md">
                      <CardContent className="p-6">
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">AI Recommendation</p>
                          <p className="text-sm font-medium">Oil change likely in 10 days</p>
                          <Badge className="bg-blue-500 text-white">Low Priority</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="rounded-2xl shadow-md">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold">Health Score Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={healthScoreData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                          <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e5e7eb",
                              borderRadius: "8px",
                            }}
                          />
                          <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Activity Tab */}
                <TabsContent value="activity" className="space-y-4">
                  <h3 className="text-lg font-semibold">Activity Timeline</h3>

                  <Card className="rounded-2xl shadow-md">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {activityTimeline.map((activity) => (
                          <div key={activity.id} className="flex gap-4">
                            <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.type)}</div>
                            <div className="flex-1 space-y-1 pb-4 border-b border-border last:border-0 last:pb-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">{activity.type}</p>
                                <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                              </div>
                              {activity.customer && (
                                <p className="text-sm text-muted-foreground">Customer: {activity.customer}</p>
                              )}
                              {activity.vendor && (
                                <p className="text-sm text-muted-foreground">Vendor: {activity.vendor}</p>
                              )}
                              {activity.description && (
                                <p className="text-sm text-muted-foreground">{activity.description}</p>
                              )}
                              <p className="text-xs text-muted-foreground">Logged by: {activity.staff}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tickets Tab */}
                <TabsContent value="tickets" className="space-y-4">
                  <h3 className="text-lg font-semibold">Related Incidents</h3>

                  {relatedTickets.length === 0 ? (
                    <Card className="rounded-2xl shadow-md">
                      <CardContent className="p-12 text-center">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No incidents reported for this vehicle</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="rounded-2xl shadow-md">
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Ticket ID</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {relatedTickets.map((ticket) => (
                              <TableRow key={ticket.id}>
                                <TableCell className="font-mono">{ticket.id}</TableCell>
                                <TableCell>{ticket.type}</TableCell>
                                <TableCell>
                                  <Badge className="bg-green-500 text-white">{ticket.status}</Badge>
                                </TableCell>
                                <TableCell>{ticket.date}</TableCell>
                                <TableCell>
                                  <Button variant="outline" size="sm">
                                    <FileText className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
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
