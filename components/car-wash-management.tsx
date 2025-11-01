"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Plus,
  Search,
  CheckCircle,
  Calendar,
  Droplet,
  AlertTriangle,
  Clock,
  DollarSign,
  TrendingUp,
} from "lucide-react"
import { ScheduleWashModal } from "@/components/schedule-wash-modal"

type WashStatus = "Scheduled" | "Completed" | "Missed"

interface CarWash {
  id: string
  carName: string
  carImage: string
  scheduledDate: string
  completedDate: string | null
  vendor: string
  status: WashStatus
  cost: number
  notes?: string
}

const mockCarWashes: CarWash[] = [
  {
    id: "1",
    carName: "Toyota Camry - ABC-1234",
    carImage: "/toyota-camry-sedan.png",
    scheduledDate: "2025-01-12",
    completedDate: "2025-01-12",
    vendor: "Sparkle Auto Wash",
    status: "Completed",
    cost: 25,
  },
  {
    id: "2",
    carName: "Honda Odyssey - XYZ-5678",
    carImage: "/honda-odyssey-mpv.jpg",
    scheduledDate: "2025-01-10",
    completedDate: null,
    vendor: "Clean & Shine",
    status: "Scheduled",
    cost: 30,
  },
  {
    id: "3",
    carName: "Ford Explorer - DEF-9012",
    carImage: "/ford-explorer-suv.jpg",
    scheduledDate: "2025-01-05",
    completedDate: null,
    vendor: "Quick Wash Pro",
    status: "Missed",
    cost: 28,
  },
  {
    id: "4",
    carName: "Nissan Altima - GHI-3456",
    carImage: "/nissan-altima-sedan.jpg",
    scheduledDate: "2025-01-15",
    completedDate: null,
    vendor: "Sparkle Auto Wash",
    status: "Scheduled",
    cost: 25,
  },
  {
    id: "5",
    carName: "Chevrolet Tahoe - JKL-7890",
    carImage: "/chevrolet-tahoe-suv.jpg",
    scheduledDate: "2025-01-08",
    completedDate: "2025-01-08",
    vendor: "Clean & Shine",
    status: "Completed",
    cost: 35,
  },
]

const statusColors: Record<WashStatus, string> = {
  Scheduled: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  Completed: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  Missed: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
}

export function CarWashManagement() {
  const [carWashes, setCarWashes] = useState<CarWash[]>(mockCarWashes)
  const [searchQuery, setSearchQuery] = useState("")
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)

  // Calculate summary metrics
  const carsDueForWash = carWashes.filter((wash) => wash.status === "Scheduled").length
  const overdueWashes = carWashes.filter((wash) => {
    if (wash.status !== "Scheduled") return false
    const scheduledDate = new Date(wash.scheduledDate)
    const today = new Date()
    const diffDays = Math.floor((today.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays > 3
  }).length
  const averageWashInterval = 14 // days (mock data)
  const totalWashCostThisMonth = carWashes
    .filter((wash) => {
      const washDate = new Date(wash.completedDate || wash.scheduledDate)
      const today = new Date()
      return washDate.getMonth() === today.getMonth() && washDate.getFullYear() === today.getFullYear()
    })
    .reduce((sum, wash) => sum + wash.cost, 0)

  // Check for overdue washes
  const criticalOverdueWashes = carWashes.filter((wash) => {
    if (wash.status !== "Scheduled") return false
    const scheduledDate = new Date(wash.scheduledDate)
    const today = new Date()
    const diffDays = Math.floor((today.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays > 3
  })

  const filteredCarWashes = carWashes.filter((wash) => {
    const matchesSearch =
      wash.carName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wash.vendor.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const handleScheduleWash = (newWash: Omit<CarWash, "id" | "completedDate" | "status">) => {
    const wash: CarWash = {
      ...newWash,
      id: String(carWashes.length + 1),
      completedDate: null,
      status: "Scheduled",
    }
    setCarWashes([...carWashes, wash])
  }

  const handleMarkComplete = (washId: string) => {
    setCarWashes(
      carWashes.map((wash) =>
        wash.id === washId
          ? { ...wash, status: "Completed" as WashStatus, completedDate: new Date().toISOString().split("T")[0] }
          : wash,
      ),
    )
  }

  const handleReschedule = (washId: string) => {
    // In a real app, this would open a modal to select a new date
    const newDate = new Date()
    newDate.setDate(newDate.getDate() + 7)
    setCarWashes(
      carWashes.map((wash) =>
        wash.id === washId
          ? { ...wash, scheduledDate: newDate.toISOString().split("T")[0], status: "Scheduled" as WashStatus }
          : wash,
      ),
    )
  }

  return (
    <div className="space-y-4">
      {/* Alert Section for Overdue Washes */}
      {criticalOverdueWashes.length > 0 && (
        <Alert variant="destructive" className="rounded-2xl border-red-500/50 bg-red-500/10">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="font-semibold">Overdue Washes Detected</AlertTitle>
          <AlertDescription>
            {criticalOverdueWashes.length} car{criticalOverdueWashes.length > 1 ? "s are" : " is"} overdue for washing
            by more than 3 days. Please schedule immediately.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-teal-500/20 bg-gradient-to-br from-teal-500/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cars Due for Wash</CardTitle>
            <Droplet className="h-5 w-5 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{carsDueForWash}</div>
            <p className="text-xs text-muted-foreground mt-1">Scheduled this week</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue Washes</CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{overdueWashes}</div>
            <p className="text-xs text-muted-foreground mt-1">More than 3 days overdue</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Wash Interval</CardTitle>
            <Clock className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{averageWashInterval}</div>
            <p className="text-xs text-muted-foreground mt-1">Days between washes</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost This Month</CardTitle>
            <DollarSign className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">${totalWashCostThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              Wash expenses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <Card className="rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by car or vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Schedule Wash Button */}
          <Button
            onClick={() => setIsScheduleModalOpen(true)}
            className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Schedule Wash
          </Button>
        </div>
      </Card>

      {/* Results Count */}
      <div>
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredCarWashes.length}</span> of{" "}
          <span className="font-semibold text-foreground">{carWashes.length}</span> wash records
        </p>
      </div>

      {/* Table View */}
      <Card className="rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Car</TableHead>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Completed Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right w-[180px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCarWashes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No wash records found matching your search
                  </TableCell>
                </TableRow>
              ) : (
                filteredCarWashes.map((wash) => (
                  <TableRow key={wash.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={wash.carImage || "/placeholder.svg"}
                          alt={wash.carName}
                          className="h-10 w-16 object-cover rounded-lg"
                        />
                        <span className="font-medium">{wash.carName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(wash.scheduledDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {wash.completedDate
                        ? new Date(wash.completedDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "-"}
                    </TableCell>
                    <TableCell>{wash.vendor}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[wash.status]}>
                        {wash.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">${wash.cost}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {wash.status === "Scheduled" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkComplete(wash.id)}
                              className="h-8 text-xs border-green-500/30 text-green-700 dark:text-green-400 hover:bg-green-500/10"
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                              Complete
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReschedule(wash.id)}
                              className="h-8 text-xs"
                            >
                              <Calendar className="h-3.5 w-3.5 mr-1.5" />
                              Reschedule
                            </Button>
                          </>
                        )}
                        {wash.status === "Missed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReschedule(wash.id)}
                            className="h-8 text-xs border-red-500/30 text-red-700 dark:text-red-400 hover:bg-red-500/10"
                          >
                            <Calendar className="h-3.5 w-3.5 mr-1.5" />
                            Reschedule
                          </Button>
                        )}
                        {wash.status === "Completed" && (
                          <span className="text-xs text-muted-foreground">No actions</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Schedule Wash Modal */}
      <ScheduleWashModal
        open={isScheduleModalOpen}
        onOpenChange={setIsScheduleModalOpen}
        onScheduleWash={handleScheduleWash}
      />
    </div>
  )
}
