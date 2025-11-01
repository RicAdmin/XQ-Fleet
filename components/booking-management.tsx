"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Plus, Search, Edit, ChevronDown, ChevronUp, Link, TruckIcon, PackageCheck, Clock } from "lucide-react"
import { CreateBookingModal } from "@/components/create-booking-modal"
import { PickupProcessModal } from "@/components/pickup-process-modal"
import { ReturnProcessModal } from "@/components/return-process-modal"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/lib/user-context"
import { ExtendHourModal } from "@/components/extend-hour-modal"

type JobStatus = "Pending" | "Active" | "Cancelled" | "Completed"

interface StatusChangeLog {
  id: string
  changedBy: string
  fromStatus: JobStatus
  toStatus: JobStatus
  reason: string
  timestamp: string
}

interface Job {
  id: string
  jobId: string
  orderInvoiceId?: string
  carName: string
  customerName: string
  customerMobile: string
  startDate: string
  endDate: string
  status: JobStatus
  totalAmount: number
  pickedUp?: boolean
  returned?: boolean
  depositCollected?: boolean
  depositAmount?: number
  depositCollectedBy?: string
  depositCollectedOn?: string
  pickedUpBy?: string
  pickedUpOn?: string
  returnedBy?: string
  returnedOn?: string
  statusChangeLogs?: StatusChangeLog[]
  carOperator?: string
}

type DateFilter = "all" | "today" | "yesterday" | "1-3days" | "1week" | "custom"

const mockJobs: Job[] = [
  {
    id: "1",
    jobId: "JOB-2025-001",
    carName: "Toyota Camry",
    customerName: "John Smith",
    customerMobile: "+60123456789",
    startDate: "2025-01-10",
    endDate: "2025-01-15",
    status: "Active",
    totalAmount: 225,
    pickedUp: true,
    returned: false,
    depositCollected: true,
    depositAmount: 100,
    depositCollectedBy: "Ahmad bin Ali",
    depositCollectedOn: "2025-01-10 09:00 AM",
    pickedUpBy: "Ahmad bin Ali",
    pickedUpOn: "2025-01-10 09:30 AM",
  },
  {
    id: "2",
    jobId: "JOB-2025-002",
    carName: "Honda Odyssey",
    customerName: "Sarah Johnson",
    customerMobile: "+60198765432",
    startDate: "2025-01-12",
    endDate: "2025-01-14",
    status: "Pending",
    totalAmount: 130,
    pickedUp: false,
    returned: false,
    depositCollected: false,
  },
  {
    id: "3",
    jobId: "JOB-2025-003",
    carName: "Ford Explorer",
    customerName: "Michael Chen",
    customerMobile: "+60187654321",
    startDate: "2025-01-08",
    endDate: "2025-01-11",
    status: "Completed",
    totalAmount: 225,
    pickedUp: true,
    returned: true,
    depositCollected: true,
    depositAmount: 150,
    pickedUpBy: "Ahmad bin Ali",
    returnedBy: "Siti Nurhaliza",
  },
  {
    id: "4",
    jobId: "JOB-2025-004",
    carName: "Nissan Altima",
    customerName: "Emily Davis",
    customerMobile: "+60176543210",
    startDate: "2025-01-15",
    endDate: "2025-01-20",
    status: "Active",
    totalAmount: 210,
    pickedUp: false,
    returned: false,
    depositCollected: false,
  },
  {
    id: "5",
    jobId: "JOB-2025-005",
    carName: "Chevrolet Tahoe",
    customerName: "David Wilson",
    customerMobile: "+60165432109",
    startDate: "2025-01-05",
    endDate: "2025-01-07",
    status: "Cancelled",
    totalAmount: 170,
    pickedUp: false,
    returned: false,
    depositCollected: false,
  },
]

const statusColors: Record<JobStatus, string> = {
  Pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  Active: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  Completed: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  Cancelled: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
}

export function BookingManagement() {
  const [jobs, setJobs] = useState<Job[]>(mockJobs)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<string>("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null)

  const [isPickupProcessModalOpen, setIsPickupProcessModalOpen] = useState(false)
  const [isReturnProcessModalOpen, setIsReturnProcessModalOpen] = useState(false)
  const [isExtendHourModalOpen, setIsExtendHourModalOpen] = useState(false)
  const [selectedJobForProcess, setSelectedJobForProcess] = useState<Job | null>(null)

  const [dateFilter, setDateFilter] = useState<DateFilter>("all")
  const [customDateFrom, setCustomDateFrom] = useState<Date>()
  const [customDateTo, setCustomDateTo] = useState<Date>()

  const { toast } = useToast()
  const { currentUser } = useUser()

  const isDateInRange = (dateStr: string): boolean => {
    if (dateFilter === "all") return true

    const bookingDate = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    switch (dateFilter) {
      case "today":
        const todayEnd = new Date(today)
        todayEnd.setHours(23, 59, 59, 999)
        return bookingDate >= today && bookingDate <= todayEnd

      case "yesterday":
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayEnd = new Date(yesterday)
        yesterdayEnd.setHours(23, 59, 59, 999)
        return bookingDate >= yesterday && bookingDate <= yesterdayEnd

      case "1-3days":
        const threeDaysAgo = new Date(today)
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
        return bookingDate >= threeDaysAgo && bookingDate <= today

      case "1week":
        const oneWeekAgo = new Date(today)
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        return bookingDate >= oneWeekAgo && bookingDate <= today

      case "custom":
        if (!customDateFrom || !customDateTo) return true
        const fromDate = new Date(customDateFrom)
        fromDate.setHours(0, 0, 0, 0)
        const toDate = new Date(customDateTo)
        toDate.setHours(23, 59, 59, 999)
        return bookingDate >= fromDate && bookingDate <= toDate

      default:
        return true
    }
  }

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.jobId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.carName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.customerName.toLowerCase().includes(searchQuery.toLowerCase())

    let matchesTab = true
    if (activeTab === "active") {
      matchesTab = job.status === "Pending" || job.status === "Active"
    } else if (activeTab === "completed") {
      matchesTab = job.status === "Completed"
    }

    const matchesDateFilter = isDateInRange(job.startDate)

    return matchesSearch && matchesTab && matchesDateFilter
  })

  const handleCreateJob = (newJob: Omit<Job, "id" | "jobId">) => {
    const job: Job = {
      ...newJob,
      id: String(jobs.length + 1),
      jobId: `JOB-2025-${String(jobs.length + 1).padStart(3, "0")}`,
    }
    setJobs([...jobs, job])
  }

  const handleEditJob = (updatedJob: Omit<Job, "id" | "jobId">) => {
    if (!editingJob) return

    setJobs(
      jobs.map((job) =>
        job.id === editingJob.id ? { ...updatedJob, id: editingJob.id, jobId: editingJob.jobId } : job,
      ),
    )
    setEditingJob(null)
  }

  const handleOpenEditModal = (job: Job) => {
    setEditingJob(job)
    setIsEditModalOpen(true)
  }

  const handleTogglePickup = (jobId: string) => {
    setJobs(jobs.map((job) => (job.id === jobId ? { ...job, pickedUp: !job.pickedUp } : job)))
  }

  const handleToggleReturn = (jobId: string) => {
    setJobs(jobs.map((job) => (job.id === jobId ? { ...job, returned: !job.returned } : job)))
  }

  const handleToggleDeposit = (jobId: string) => {
    setJobs(jobs.map((job) => (job.id === jobId ? { ...job, depositCollected: !job.depositCollected } : job)))
  }

  const toggleExpandJob = (jobId: string) => {
    setExpandedJobId(expandedJobId === jobId ? null : jobId)
  }

  const handleCopyLink = (job: Job) => {
    const baseUrl = window.location.origin
    const shareableUrl = `${baseUrl}/client?jobId=${encodeURIComponent(job.jobId)}&mobile=${encodeURIComponent(job.customerMobile)}`

    navigator.clipboard
      .writeText(shareableUrl)
      .then(() => {
        toast({
          title: "Link copied!",
          description: "The client access link has been copied to your clipboard.",
        })
      })
      .catch(() => {
        toast({
          title: "Failed to copy",
          description: "Please try again or copy the link manually.",
          variant: "destructive",
        })
      })
  }

  const handleOpenPickupProcess = (job: Job) => {
    setSelectedJobForProcess(job)
    setIsPickupProcessModalOpen(true)
  }

  const handleOpenReturnProcess = (job: Job) => {
    setSelectedJobForProcess(job)
    setIsReturnProcessModalOpen(true)
  }

  const handleOpenExtendHour = (job: Job) => {
    setSelectedJobForProcess(job)
    setIsExtendHourModalOpen(true)
  }

  const isOperatorOrAdmin = currentUser?.role === "Operation" || currentUser?.role === "Super Admin"

  return (
    <div className="p-4 sm:p-6 space-y-4 pb-24 lg:pb-6">
      <Card className="rounded-xl p-4 glass-card border-white/40">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">Filter by Job Date</h3>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={dateFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateFilter("all")}
              className={cn(
                "h-9 transition-all duration-200",
                dateFilter === "all" && "bg-[#FF8945] hover:bg-[#FF8945]/90 text-white shadow-sm",
              )}
            >
              All
            </Button>
            <Button
              variant={dateFilter === "today" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateFilter("today")}
              className={cn(
                "h-9 transition-all duration-200",
                dateFilter === "today" && "bg-[#FF8945] hover:bg-[#FF8945]/90 text-white shadow-sm",
              )}
            >
              Today
            </Button>
            <Button
              variant={dateFilter === "yesterday" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateFilter("yesterday")}
              className={cn(
                "h-9 transition-all duration-200",
                dateFilter === "yesterday" && "bg-[#FF8945] hover:bg-[#FF8945]/90 text-white shadow-sm",
              )}
            >
              Yesterday
            </Button>
            <Button
              variant={dateFilter === "1-3days" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateFilter("1-3days")}
              className={cn(
                "h-9 transition-all duration-200",
                dateFilter === "1-3days" && "bg-[#FF8945] hover:bg-[#FF8945]/90 text-white shadow-sm",
              )}
            >
              1-3 Days
            </Button>
            <Button
              variant={dateFilter === "1week" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateFilter("1week")}
              className={cn(
                "h-9 transition-all duration-200",
                dateFilter === "1week" && "bg-[#FF8945] hover:bg-[#FF8945]/90 text-white shadow-sm",
              )}
            >
              1 Week
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={dateFilter === "custom" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "justify-start text-left font-normal h-9 transition-all duration-200",
                    dateFilter === "custom" && "bg-[#FF8945] hover:bg-[#FF8945]/90 text-white shadow-sm",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">
                    {dateFilter === "custom" && customDateFrom && customDateTo
                      ? `${format(customDateFrom, "MMM dd")} - ${format(customDateTo, "MMM dd")}`
                      : "Custom Range"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="flex gap-4 p-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">From Date</label>
                    <Calendar
                      mode="single"
                      selected={customDateFrom}
                      onSelect={(date) => {
                        setCustomDateFrom(date)
                        if (date && customDateTo) {
                          setDateFilter("custom")
                        }
                      }}
                      initialFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">To Date</label>
                    <Calendar
                      mode="single"
                      selected={customDateTo}
                      onSelect={(date) => {
                        setCustomDateTo(date)
                        if (customDateFrom && date) {
                          setDateFilter("custom")
                        }
                      }}
                      disabled={(date) => (customDateFrom ? date < customDateFrom : false)}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </Card>

      <Card className="rounded-xl p-4 glass-card border-white/40">
        <div className="flex flex-col gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="h-10 w-full sm:w-auto grid grid-cols-4 sm:inline-flex">
              <TabsTrigger value="all" className="px-4">
                All
              </TabsTrigger>
              <TabsTrigger value="active" className="px-4">
                Active
              </TabsTrigger>
              <TabsTrigger value="completed" className="px-4">
                Completed
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="px-4">
                Cancelled
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-11"
              />
            </div>

            <Button onClick={() => setIsCreateModalOpen(true)} className="w-full sm:w-auto h-11 shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Job
            </Button>
          </div>
        </div>
      </Card>

      <div>
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredJobs.length}</span> of{" "}
          <span className="font-semibold text-foreground">{jobs.length}</span> jobs
        </p>
      </div>

      <Card className="rounded-xl overflow-hidden glass-card border-white/40">
        <div className="overflow-x-auto scrollbar-thin">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold whitespace-nowrap sticky left-0 bg-muted/30 z-10">Job ID</TableHead>
                <TableHead className="font-semibold whitespace-nowrap">Car</TableHead>
                <TableHead className="font-semibold whitespace-nowrap hidden md:table-cell">Customer Name</TableHead>
                <TableHead className="font-semibold whitespace-nowrap">Start Date</TableHead>
                <TableHead className="font-semibold whitespace-nowrap hidden sm:table-cell">End Date</TableHead>
                <TableHead className="font-semibold whitespace-nowrap">Status</TableHead>
                <TableHead className="text-right font-semibold whitespace-nowrap hidden lg:table-cell">
                  Total Amount
                </TableHead>
                <TableHead className="text-right font-semibold w-[100px] sm:w-[120px] whitespace-nowrap">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                    No jobs found matching your filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredJobs.map((job) => (
                  <>
                    <TableRow
                      key={job.id}
                      className="hover:bg-accent/30 transition-colors cursor-pointer"
                      onClick={() => toggleExpandJob(job.id)}
                    >
                      <TableCell className="font-mono font-semibold whitespace-nowrap text-xs sm:text-sm sticky left-0 bg-background z-10">
                        <div className="flex items-center gap-2">
                          {expandedJobId === job.id ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                          {job.jobId}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-xs sm:text-sm">
                        <span className="truncate max-w-[120px] sm:max-w-[150px] inline-block">{job.carName}</span>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm hidden md:table-cell">
                        <span className="truncate max-w-[150px] inline-block">{job.customerName}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap text-xs sm:text-sm">
                        {new Date(job.startDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap text-xs sm:text-sm hidden sm:table-cell">
                        {new Date(job.endDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(statusColors[job.status], "font-medium whitespace-nowrap text-xs")}
                        >
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold whitespace-nowrap text-xs sm:text-sm hidden lg:table-cell">
                        ${job.totalAmount}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-9 w-9 sm:h-10 sm:w-10 hover:bg-accent")}
                            onClick={() => handleCopyLink(job)}
                            title="Copy client access link"
                          >
                            <Link className="h-4 w-4" />
                            <span className="sr-only">Copy link</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-9 w-9 sm:h-10 sm:w-10 hover:bg-accent")}
                            onClick={() => handleOpenEditModal(job)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit job</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedJobId === job.id && (
                      <TableRow className="bg-muted/10">
                        <TableCell colSpan={8} className="p-4 sm:p-6">
                          <div className="flex flex-col gap-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div className="space-y-2 p-4 rounded-lg bg-background/50 border border-border/50">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                  Deposit Collected
                                </p>
                                {job.depositCollected ? (
                                  <div className="space-y-2">
                                    <div className="flex items-baseline gap-2">
                                      <Badge
                                        variant="default"
                                        className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                                      >
                                        Yes
                                      </Badge>
                                      <span className="text-lg font-bold text-foreground">
                                        ${job.depositAmount || 0}
                                      </span>
                                    </div>
                                    <div className="text-sm space-y-1">
                                      <p className="text-muted-foreground">
                                        <span className="font-medium">By:</span> {job.depositCollectedBy || "N/A"}
                                      </p>
                                      <p className="text-muted-foreground">
                                        <span className="font-medium">On:</span> {job.depositCollectedOn || "N/A"}
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">
                                    No
                                  </Badge>
                                )}
                              </div>

                              <div className="space-y-2 p-4 rounded-lg bg-background/50 border border-border/50">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                  Picked Up
                                </p>
                                {job.pickedUp ? (
                                  <div className="space-y-2">
                                    <Badge
                                      variant="default"
                                      className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                                    >
                                      Yes
                                    </Badge>
                                    <div className="text-sm space-y-1">
                                      <p className="text-muted-foreground">
                                        <span className="font-medium">By:</span> {job.pickedUpBy || "N/A"}
                                      </p>
                                      <p className="text-muted-foreground">
                                        <span className="font-medium">On:</span> {job.pickedUpOn || "N/A"}
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">
                                    No
                                  </Badge>
                                )}
                              </div>

                              <div className="space-y-2 p-4 rounded-lg bg-background/50 border border-border/50">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                  Returned
                                </p>
                                {job.returned ? (
                                  <div className="space-y-2">
                                    <Badge
                                      variant="default"
                                      className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20"
                                    >
                                      Yes
                                    </Badge>
                                    <div className="text-sm space-y-1">
                                      <p className="text-muted-foreground">
                                        <span className="font-medium">By:</span> {job.returnedBy || "N/A"}
                                      </p>
                                      <p className="text-muted-foreground">
                                        <span className="font-medium">On:</span> {job.returnedOn || "N/A"}
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">
                                    No
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {isOperatorOrAdmin && (
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleOpenPickupProcess(job)
                                  }}
                                  className="flex-1 bg-[#2663EB] hover:bg-[#2663EB]/90 text-white shadow-md h-12"
                                >
                                  <TruckIcon className="h-5 w-5 mr-2" />
                                  Pickup Process
                                </Button>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleOpenReturnProcess(job)
                                  }}
                                  className="flex-1 bg-[#FF8945] hover:bg-[#FF8945]/90 text-white shadow-md h-12"
                                >
                                  <PackageCheck className="h-5 w-5 mr-2" />
                                  Return Process
                                </Button>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleOpenExtendHour(job)
                                  }}
                                  className="flex-1 bg-purple-600 hover:bg-purple-600/90 text-white shadow-md h-12"
                                >
                                  <Clock className="h-5 w-5 mr-2" />
                                  Extend Hour
                                </Button>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <CreateBookingModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onCreateBooking={handleCreateJob}
      />

      {editingJob && (
        <CreateBookingModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onCreateBooking={handleEditJob}
          editMode={true}
          jobId={editingJob.jobId}
          initialData={editingJob}
        />
      )}

      <PickupProcessModal
        open={isPickupProcessModalOpen}
        onOpenChange={setIsPickupProcessModalOpen}
        job={selectedJobForProcess}
      />

      <ReturnProcessModal
        open={isReturnProcessModalOpen}
        onOpenChange={setIsReturnProcessModalOpen}
        job={selectedJobForProcess}
      />

      <ExtendHourModal
        open={isExtendHourModalOpen}
        onOpenChange={setIsExtendHourModalOpen}
        job={selectedJobForProcess}
      />
    </div>
  )
}
