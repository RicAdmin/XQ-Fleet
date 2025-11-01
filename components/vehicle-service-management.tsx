"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Droplet, Wrench } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScheduleServiceModal } from "@/components/schedule-service-modal"
import { EditServiceModal } from "@/components/edit-service-modal"

type ServiceType = "Maintenance" | "Wash"
type ServiceStatus = "Scheduled" | "Progressing" | "Completed" | "Missed" | "Urgent"

interface ServiceRecord {
  id: string
  carName: string
  carImage: string
  type: ServiceType
  requestedDate: string
  requestedTime: string
  scheduledDate: string
  completedDate: string | null
  vendor: string
  status: ServiceStatus
  notes?: string
  priority?: "Low" | "Medium" | "High"
  cost?: number
}

const mockServiceRecords: ServiceRecord[] = [
  // Maintenance records
  {
    id: "m1",
    carName: "Toyota Camry - ABC-1234",
    carImage: "/toyota-camry-sedan.png",
    type: "Maintenance",
    requestedDate: "2025-01-10",
    requestedTime: "09:00",
    scheduledDate: "2025-01-15",
    completedDate: null,
    vendor: "AutoCare Pro",
    status: "Urgent",
    priority: "High",
    notes: "Oil change and brake inspection",
    cost: 50,
  },
  {
    id: "m2",
    carName: "Honda Odyssey - XYZ-5678",
    carImage: "/honda-odyssey-mpv.jpg",
    type: "Maintenance",
    requestedDate: "2025-01-12",
    requestedTime: "14:30",
    scheduledDate: "2025-01-20",
    completedDate: null,
    vendor: "Quick Fix Auto",
    status: "Scheduled",
    priority: "Medium",
    cost: 75,
  },
  {
    id: "m3",
    carName: "Ford Explorer - DEF-9012",
    carImage: "/ford-explorer-suv.jpg",
    type: "Maintenance",
    requestedDate: "2025-01-05",
    requestedTime: "10:00",
    scheduledDate: "2025-01-08",
    completedDate: "2025-01-08",
    vendor: "AutoCare Pro",
    status: "Completed",
    priority: "High",
    cost: 100,
  },
  // Wash records
  {
    id: "w1",
    carName: "Toyota Camry - ABC-1234",
    carImage: "/toyota-camry-sedan.png",
    type: "Wash",
    requestedDate: "2025-01-11",
    requestedTime: "11:00",
    scheduledDate: "2025-01-12",
    completedDate: "2025-01-12",
    vendor: "Sparkle Auto Wash",
    status: "Completed",
    cost: 30,
  },
  {
    id: "w2",
    carName: "Honda Odyssey - XYZ-5678",
    carImage: "/honda-odyssey-mpv.jpg",
    type: "Wash",
    requestedDate: "2025-01-09",
    requestedTime: "15:00",
    scheduledDate: "2025-01-10",
    completedDate: null,
    vendor: "Clean & Shine",
    status: "Progressing",
    cost: 40,
  },
  {
    id: "w3",
    carName: "Nissan Altima - GHI-3456",
    carImage: "/nissan-altima-sedan.jpg",
    type: "Wash",
    requestedDate: "2025-01-04",
    requestedTime: "13:30",
    scheduledDate: "2025-01-05",
    completedDate: null,
    vendor: "Quick Wash Pro",
    status: "Missed",
    cost: 25,
  },
]

const statusColors: Record<ServiceStatus, string> = {
  Scheduled: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  Progressing: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  Completed: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  Missed: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  Urgent: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
}

export function VehicleServiceManagement() {
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>(mockServiceRecords)
  const [searchQuery, setSearchQuery] = useState("")
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<ServiceRecord | null>(null)
  const [activeTab, setActiveTab] = useState<"all" | "maintenance" | "wash">("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const maintenanceRecords = serviceRecords.filter((r) => r.type === "Maintenance")
  const washRecords = serviceRecords.filter((r) => r.type === "Wash")

  const urgentMaintenance = maintenanceRecords.filter((r) => r.status === "Urgent").length
  const scheduledMaintenance = maintenanceRecords.filter((r) => r.status === "Scheduled").length
  const carsDueForWash = washRecords.filter((r) => r.status === "Scheduled").length
  const overdueWashes = washRecords.filter((r) => r.status === "Missed").length

  const totalCostThisMonth = serviceRecords
    .filter((record) => {
      const recordDate = new Date(record.completedDate || record.scheduledDate)
      const today = new Date()
      return recordDate.getMonth() === today.getMonth() && recordDate.getFullYear() === today.getFullYear()
    })
    .reduce((sum, record) => sum + (record.cost || 0), 0)

  const filteredRecords = serviceRecords.filter((record) => {
    const matchesSearch =
      record.carName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.vendor.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = activeTab === "all" || record.type.toLowerCase() === activeTab
    const matchesStatus = statusFilter === "all" || record.status.toLowerCase() === statusFilter
    return matchesSearch && matchesTab && matchesStatus
  })

  const handleStatusChange = (recordId: string, newStatus: ServiceStatus) => {
    setServiceRecords(
      serviceRecords.map((record) => {
        if (record.id === recordId) {
          const updates: Partial<ServiceRecord> = { status: newStatus }
          if (newStatus === "Completed" && !record.completedDate) {
            updates.completedDate = new Date().toISOString().split("T")[0]
          }
          return { ...record, ...updates }
        }
        return record
      }),
    )
  }

  const handleMarkComplete = (recordId: string) => {
    setServiceRecords(
      serviceRecords.map((record) =>
        record.id === recordId
          ? { ...record, status: "Completed" as ServiceStatus, completedDate: new Date().toISOString().split("T")[0] }
          : record,
      ),
    )
  }

  const handleReschedule = (recordId: string) => {
    const newDate = new Date()
    newDate.setDate(newDate.getDate() + 7)
    setServiceRecords(
      serviceRecords.map((record) =>
        record.id === recordId
          ? { ...record, scheduledDate: newDate.toISOString().split("T")[0], status: "Scheduled" as ServiceStatus }
          : record,
      ),
    )
  }

  const criticalAlerts = serviceRecords.filter(
    (r) => r.status === "Urgent" || (r.status === "Missed" && r.type === "Wash"),
  )

  const handleRowClick = (record: ServiceRecord) => {
    setSelectedService(record)
    setIsEditModalOpen(true)
  }

  const handleUpdateService = (updatedService: ServiceRecord) => {
    setServiceRecords(serviceRecords.map((record) => (record.id === updatedService.id ? updatedService : record)))
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 pb-24 lg:pb-6">
      {/* Tabs and Filters */}
      <Card className="rounded-xl p-4 glass-card border-white/40">
        <div className="flex flex-col gap-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
            <TabsList className="h-10 w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
              <TabsTrigger value="all" className="px-3 sm:px-4 text-xs sm:text-sm">
                All
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="px-3 sm:px-4 text-xs sm:text-sm">
                Maintenance
              </TabsTrigger>
              <TabsTrigger value="wash" className="px-3 sm:px-4 text-xs sm:text-sm">
                Wash
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by car or vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-11"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px] h-11">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="progressing">Progressing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="missed">Missed</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={() => setIsScheduleModalOpen(true)} className="w-full sm:w-auto h-11 shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Service
            </Button>
          </div>
        </div>
      </Card>

      {/* Results Count */}
      <div>
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredRecords.length}</span> of{" "}
          <span className="font-semibold text-foreground">{serviceRecords.length}</span> service records
        </p>
      </div>

      {/* Table View */}
      <Card className="rounded-xl overflow-hidden glass-card border-white/40">
        <div className="overflow-x-auto scrollbar-thin">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold whitespace-nowrap sticky left-0 bg-muted/30 z-10">
                  Vehicle
                </TableHead>
                <TableHead className="font-semibold whitespace-nowrap">Service Type</TableHead>
                <TableHead className="font-semibold whitespace-nowrap hidden md:table-cell">Request On</TableHead>
                <TableHead className="font-semibold whitespace-nowrap">Scheduled Date</TableHead>
                <TableHead className="font-semibold whitespace-nowrap hidden lg:table-cell">Completed Date</TableHead>
                <TableHead className="font-semibold whitespace-nowrap">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                    No service records found matching your filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow
                    key={record.id}
                    className="hover:bg-accent/30 transition-colors cursor-pointer"
                    onClick={() => handleRowClick(record)}
                  >
                    <TableCell className="sticky left-0 bg-background z-10">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="relative w-12 h-8 sm:w-16 sm:h-10 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                          <img
                            src={record.carImage || "/placeholder.svg"}
                            alt={record.carName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                          {record.carName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {record.type === "Maintenance" ? (
                          <Wrench className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                        ) : (
                          <Droplet className="h-3 w-3 sm:h-4 sm:w-4 text-teal-500 flex-shrink-0" />
                        )}
                        <span className="text-xs sm:text-sm">{record.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap hidden md:table-cell">
                      {new Date(record.requestedDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      {record.requestedTime}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(record.scheduledDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap hidden lg:table-cell">
                      {record.completedDate
                        ? new Date(record.completedDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div
                        className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium border ${statusColors[record.status]}`}
                      >
                        {record.status}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Schedule Modal */}
      <ScheduleServiceModal
        open={isScheduleModalOpen}
        onOpenChange={setIsScheduleModalOpen}
        onScheduleService={(data) => {
          const newRecord: ServiceRecord = {
            ...data,
            id: String(serviceRecords.length + 1),
            completedDate: null,
            status: "Scheduled",
          }
          setServiceRecords([...serviceRecords, newRecord])
        }}
      />

      {/* Edit Service Modal */}
      <EditServiceModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        service={selectedService}
        onUpdateService={handleUpdateService}
      />
    </div>
  )
}
