"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Edit, ChevronDown, ChevronRight, Plus, Trash2, CalendarIcon, X, ZoomIn } from "lucide-react"
import { CreateTicketModal } from "@/components/create-ticket-modal"
import { EditTicketModal } from "@/components/edit-ticket-modal"
import Image from "next/image"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Dialog, DialogContent } from "@/components/ui/dialog"

type TicketStatus = "Open" | "In Review" | "Resolved"
type TicketSeverity = "Low" | "Medium" | "High"
type TicketType = "Accident" | "Extend Hour" | "Complaint"

interface Ticket {
  id: string
  ticketId: string
  carPlate: string
  carModel: string
  carImage: string
  type: TicketType
  severity: TicketSeverity
  status: TicketStatus
  reportedBy: string
  createdDate: string
  createdTime: string
  pic?: string
  description: string
  photos: string[]
  linkedBooking?: string
  timeline: { date: string; action: string; by: string }[]
}

const mockTickets: Ticket[] = [
  {
    id: "1",
    ticketId: "TKT-2025-001",
    carPlate: "WXY 1234",
    carModel: "Toyota Camry",
    carImage: "/toyota-camry-sedan.png",
    type: "Accident",
    severity: "High",
    status: "Open",
    reportedBy: "Staff",
    createdDate: "2025-01-09",
    createdTime: "10:30 AM",
    pic: "John Manager",
    description: "Minor collision in parking lot. Front bumper damaged.",
    photos: ["/damaged-car.png"],
    linkedBooking: "BK-2025-001",
    timeline: [
      { date: "2025-01-09 10:30 AM", action: "Ticket created", by: "John Staff" },
      { date: "2025-01-09 11:00 AM", action: "Photos uploaded", by: "John Staff" },
    ],
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
    reportedBy: "Customer",
    createdDate: "2025-01-08",
    createdTime: "02:00 PM",
    pic: "Sarah Admin",
    description: "Customer requested 2-hour extension for return time.",
    photos: [],
    linkedBooking: "BK-2025-002",
    timeline: [
      { date: "2025-01-08 02:00 PM", action: "Extension requested", by: "Sarah Johnson" },
      { date: "2025-01-08 02:15 PM", action: "Approved by manager", by: "Manager" },
      { date: "2025-01-08 02:20 PM", action: "Ticket resolved", by: "Manager" },
    ],
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
    reportedBy: "Customer",
    createdDate: "2025-01-07",
    createdTime: "09:00 AM",
    pic: "Michael Supervisor",
    description: "Customer complained about cleanliness of vehicle interior.",
    photos: ["/modern-car-interior.png"],
    linkedBooking: "BK-2025-003",
    timeline: [
      { date: "2025-01-07 09:00 AM", action: "Complaint received", by: "Michael Chen" },
      { date: "2025-01-07 10:00 AM", action: "Assigned to supervisor", by: "Staff" },
    ],
  },
  {
    id: "4",
    ticketId: "TKT-2025-004",
    carPlate: "GHI 3456",
    carModel: "Nissan Altima",
    carImage: "/nissan-altima-sedan.jpg",
    type: "Accident",
    severity: "Medium",
    status: "In Review",
    reportedBy: "Staff",
    createdDate: "2025-01-06",
    createdTime: "03:00 PM",
    pic: "David Manager",
    description: "Scratch on driver side door. Investigating cause.",
    photos: ["/car-scratch.jpg"],
    linkedBooking: "BK-2025-004",
    timeline: [
      { date: "2025-01-06 03:00 PM", action: "Damage reported", by: "Staff" },
      { date: "2025-01-06 03:30 PM", action: "Photos documented", by: "Staff" },
    ],
  },
  {
    id: "5",
    ticketId: "TKT-2025-005",
    carPlate: "JKL 7890",
    carModel: "Chevrolet Tahoe",
    carImage: "/chevrolet-tahoe-suv.jpg",
    type: "Complaint",
    severity: "Low",
    status: "Resolved",
    reportedBy: "Customer",
    createdDate: "2025-01-05",
    createdTime: "11:00 AM",
    pic: "Lisa Technician",
    description: "Customer reported AC not cooling properly. Issue resolved.",
    photos: [],
    linkedBooking: "BK-2025-005",
    timeline: [
      { date: "2025-01-05 11:00 AM", action: "Issue reported", by: "David Wilson" },
      { date: "2025-01-05 02:00 PM", action: "Technician inspected", by: "Technician" },
      { date: "2025-01-05 03:00 PM", action: "AC recharged, resolved", by: "Technician" },
    ],
  },
]

const statusColors: Record<TicketStatus, string> = {
  Open: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  "In Review": "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  Resolved: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
}

const severityColors: Record<TicketSeverity, string> = {
  High: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  Medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  Low: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
}

type DateFilter = "today" | "1-3days" | "1week" | "passed3days" | "custom"

export function TicketsManagement() {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null)
  const [lightboxMedia, setLightboxMedia] = useState<string | null>(null)

  const [dateFilter, setDateFilter] = useState<DateFilter>("1-3days")
  const [customDateFrom, setCustomDateFrom] = useState<Date>()
  const [customDateTo, setCustomDateTo] = useState<Date>()

  const isDateInRange = (dateStr: string): boolean => {
    const ticketDate = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    switch (dateFilter) {
      case "today":
        const todayEnd = new Date(today)
        todayEnd.setHours(23, 59, 59, 999)
        return ticketDate >= today && ticketDate <= todayEnd

      case "1-3days":
        const threeDaysAgo = new Date(today)
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
        return ticketDate >= threeDaysAgo && ticketDate <= today

      case "1week":
        const oneWeekAgo = new Date(today)
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        return ticketDate >= oneWeekAgo && ticketDate <= today

      case "passed3days":
        const threeDaysAgoLimit = new Date(today)
        threeDaysAgoLimit.setDate(threeDaysAgoLimit.getDate() - 3)
        return ticketDate < threeDaysAgoLimit

      case "custom":
        if (!customDateFrom || !customDateTo) return true
        const fromDate = new Date(customDateFrom)
        fromDate.setHours(0, 0, 0, 0)
        const toDate = new Date(customDateTo)
        toDate.setHours(23, 59, 59, 999)
        return ticketDate >= fromDate && ticketDate <= toDate

      default:
        return true
    }
  }

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.carPlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.carModel.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter
    const matchesSeverity = severityFilter === "all" || ticket.severity === severityFilter
    const matchesCategory = categoryFilter === "all" || ticket.type === categoryFilter
    const matchesDateFilter = isDateInRange(ticket.createdDate)

    return matchesSearch && matchesStatus && matchesSeverity && matchesCategory && matchesDateFilter
  })

  const toggleRow = (ticketId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(ticketId)) {
      newExpanded.delete(ticketId)
    } else {
      newExpanded.add(ticketId)
    }
    setExpandedRows(newExpanded)
  }

  const handleCreateTicket = (newTicket: Omit<Ticket, "id" | "ticketId" | "timeline">) => {
    const now = new Date()
    const ticket: Ticket = {
      ...newTicket,
      id: String(tickets.length + 1),
      ticketId: `TKT-2025-${String(tickets.length + 1).padStart(3, "0")}`,
      timeline: [
        {
          date: now.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }),
          action: "Ticket created",
          by: newTicket.reportedBy,
        },
      ],
    }
    setTickets([ticket, ...tickets])
  }

  const handleEditTicket = (updatedTicket: Ticket) => {
    setTickets(tickets.map((ticket) => (ticket.id === updatedTicket.id ? updatedTicket : ticket)))
    setEditingTicket(null)
  }

  const handleDeleteTicket = (ticketId: string) => {
    if (confirm("Are you sure you want to delete this ticket?")) {
      setTickets(tickets.filter((ticket) => ticket.id !== ticketId))
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 pb-24 lg:pb-6">
      <Card className="rounded-xl p-4 glass-card border-white/40">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">Filter by Created Date</h3>

          <div className="flex flex-wrap gap-2">
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
            <Button
              variant={dateFilter === "passed3days" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateFilter("passed3days")}
              className={cn(
                "h-9 transition-all duration-200",
                dateFilter === "passed3days" && "bg-[#FF8945] hover:bg-[#FF8945]/90 text-white shadow-sm",
              )}
            >
              Passed 3 Days
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

      {/* Filter Bar */}
      <Card className="rounded-xl p-4 glass-card border-white/40">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ticket number, car plate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Review">In Review</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Accident">Accident</SelectItem>
                <SelectItem value="Extend Hour">Extend Hour</SelectItem>
                <SelectItem value="Complaint">Complaint</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={() => setIsCreateModalOpen(true)} className="h-11 shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Create Ticket</span>
              <span className="sm:hidden">Create</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Results Count */}
      <div>
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredTickets.length}</span> of{" "}
          <span className="font-semibold text-foreground">{tickets.length}</span> tickets
        </p>
      </div>

      {/* Table */}
      <Card className="rounded-xl overflow-hidden glass-card border-white/40">
        <div className="overflow-x-auto scrollbar-thin">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-[40px] sm:w-[50px]"></TableHead>
                <TableHead className="font-semibold sticky left-[40px] sm:left-[50px] bg-muted/30 z-10">
                  Ticket ID
                </TableHead>
                <TableHead className="font-semibold hidden lg:table-cell">Car</TableHead>
                <TableHead className="font-semibold">Type / Severity</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold hidden md:table-cell">Reported By</TableHead>
                <TableHead className="font-semibold hidden sm:table-cell">Created On</TableHead>
                <TableHead className="font-semibold hidden xl:table-cell">Assigned PIC</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    No tickets found matching your filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredTickets.map((ticket) => (
                  <>
                    <TableRow
                      key={ticket.id}
                      className="hover:bg-accent/30 transition-colors cursor-pointer"
                      onClick={() => toggleRow(ticket.id)}
                    >
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-8 sm:w-8">
                          {expandedRows.has(ticket.id) ? (
                            <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                          ) : (
                            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-mono font-semibold text-xs sm:text-sm sticky left-[40px] sm:left-[50px] bg-background z-10">
                        {ticket.ticketId}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            <Image
                              src={ticket.carImage || "/placeholder.svg"}
                              alt={ticket.carModel}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{ticket.carPlate}</div>
                            <div className="text-xs text-muted-foreground">{ticket.carModel}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          <Badge variant="outline" className="font-normal w-fit text-[10px] sm:text-xs">
                            {ticket.type}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn("w-fit text-[10px] sm:text-xs", severityColors[ticket.severity])}
                          >
                            {ticket.severity}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(statusColors[ticket.status], "text-[10px] sm:text-xs")}>
                          {ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs sm:text-sm hidden md:table-cell">
                        {ticket.reportedBy}
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden sm:table-cell">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground text-xs sm:text-sm">
                            {new Date(ticket.createdDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span className="text-[10px] sm:text-xs">{ticket.createdTime}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs sm:text-sm hidden xl:table-cell">
                        {ticket.pic || <span className="text-xs italic">Not assigned</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 sm:h-10 sm:w-10 hover:bg-accent"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingTicket(ticket)
                            }}
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="sr-only">Edit ticket</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 sm:h-10 sm:w-10 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteTicket(ticket.id)
                            }}
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="sr-only">Delete ticket</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {/* Expanded Row Content */}
                    {expandedRows.has(ticket.id) && (
                      <TableRow>
                        <TableCell colSpan={9} className="bg-gradient-to-br from-muted/5 via-muted/10 to-muted/5 p-0">
                          <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between pb-4 border-b border-border/30">
                              <div className="space-y-1">
                                <h3 className="text-lg font-semibold text-foreground tracking-tight">Ticket Details</h3>
                                <p className="text-sm text-muted-foreground">
                                  Complete information for{" "}
                                  <span className="font-mono font-medium text-foreground">{ticket.ticketId}</span>
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                              {/* Left Section - Vehicle & Status */}
                              <div className="space-y-4">
                                {/* Vehicle Card */}
                                <div className="rounded-xl bg-background/60 backdrop-blur-sm border border-border/50 p-4 shadow-sm">
                                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">
                                    Vehicle Information
                                  </label>
                                  <div className="flex items-center gap-4">
                                    <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-muted/50 flex-shrink-0 ring-1 ring-border/50">
                                      <Image
                                        src={ticket.carImage || "/placeholder.svg"}
                                        alt={ticket.carModel}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-semibold text-base text-foreground truncate">
                                        {ticket.carPlate}
                                      </div>
                                      <div className="text-sm text-muted-foreground truncate">{ticket.carModel}</div>
                                    </div>
                                  </div>
                                </div>

                                {/* Status Cards */}
                                <div className="rounded-xl bg-background/60 backdrop-blur-sm border border-border/50 p-4 shadow-sm space-y-3">
                                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                                    Status & Classification
                                  </label>

                                  <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-medium text-muted-foreground">Type</span>
                                      <Badge variant="outline" className="font-medium">
                                        {ticket.type}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-medium text-muted-foreground">Severity</span>
                                      <Badge
                                        variant="outline"
                                        className={cn("font-medium", severityColors[ticket.severity])}
                                      >
                                        {ticket.severity}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-medium text-muted-foreground">Status</span>
                                      <Badge
                                        variant="outline"
                                        className={cn("font-medium", statusColors[ticket.status])}
                                      >
                                        {ticket.status}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>

                                {/* Assignment & Dates */}
                                <div className="rounded-xl bg-background/60 backdrop-blur-sm border border-border/50 p-4 shadow-sm space-y-3">
                                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                                    Assignment & Timeline
                                  </label>

                                  <div className="space-y-2.5">
                                    <div>
                                      <div className="text-xs font-medium text-muted-foreground mb-1">Reported By</div>
                                      <div className="text-sm font-medium text-foreground">{ticket.reportedBy}</div>
                                    </div>
                                    <div>
                                      <div className="text-xs font-medium text-muted-foreground mb-1">Assigned PIC</div>
                                      <div className="text-sm font-medium text-foreground">
                                        {ticket.pic || (
                                          <span className="text-muted-foreground italic text-xs">Not assigned</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="pt-2 border-t border-border/30">
                                      <div className="text-xs font-medium text-muted-foreground mb-1">Created On</div>
                                      <div className="text-sm font-medium text-foreground">
                                        {new Date(ticket.createdDate).toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                        })}{" "}
                                        at {ticket.createdTime}
                                      </div>
                                    </div>
                                    {ticket.linkedBooking && (
                                      <div>
                                        <div className="text-xs font-medium text-muted-foreground mb-1">Linked Job</div>
                                        <Badge variant="outline" className="font-mono text-xs">
                                          {ticket.linkedBooking}
                                        </Badge>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Middle Section - Description & Files */}
                              <div className="xl:col-span-2 space-y-4">
                                {/* Description */}
                                <div className="rounded-xl bg-background/60 backdrop-blur-sm border border-border/50 p-4 shadow-sm">
                                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">
                                    Description & Notes
                                  </label>
                                  <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                    {ticket.description}
                                  </div>
                                </div>

                                {/* Attached Files */}
                                {ticket.photos.length > 0 && (
                                  <div className="rounded-xl bg-background/60 backdrop-blur-sm border border-border/50 p-4 shadow-sm">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">
                                      Attached Files ({ticket.photos.length})
                                    </label>
                                    <div className="flex flex-wrap gap-3">
                                      {ticket.photos.map((photo, index) => (
                                        <div
                                          key={index}
                                          className="relative h-24 w-24 rounded-xl overflow-hidden bg-muted/50 group cursor-pointer ring-2 ring-border/50 hover:ring-primary/60 transition-all duration-200 hover:scale-105"
                                          onClick={() => setLightboxMedia(photo)}
                                        >
                                          <Image
                                            src={photo || "/placeholder.svg"}
                                            alt={`Attachment ${index + 1}`}
                                            fill
                                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                                          />
                                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                            <ZoomIn className="h-6 w-6 text-white drop-shadow-lg" />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                                      <ZoomIn className="h-3 w-3" />
                                      Click any image to view full size
                                    </p>
                                  </div>
                                )}

                                {/* Timeline */}
                                <div className="rounded-xl bg-background/60 backdrop-blur-sm border border-border/50 p-4 shadow-sm">
                                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">
                                    Activity Timeline
                                  </label>
                                  <div className="space-y-3 max-h-[280px] overflow-y-auto scrollbar-thin pr-2">
                                    {ticket.timeline.map((event, index) => (
                                      <div key={index} className="flex items-start gap-3 group">
                                        <div className="relative flex flex-col items-center">
                                          <div className="h-2 w-2 rounded-full bg-primary ring-4 ring-primary/20 flex-shrink-0 mt-1.5" />
                                          {index < ticket.timeline.length - 1 && (
                                            <div className="w-px h-full bg-border/50 mt-1" />
                                          )}
                                        </div>
                                        <div className="flex-1 pb-4 space-y-1">
                                          <div className="text-xs text-muted-foreground font-medium">{event.date}</div>
                                          <div className="text-sm">
                                            <span className="font-semibold text-foreground">{event.action}</span>
                                          </div>
                                          <div className="text-xs text-muted-foreground">by {event.by}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
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

      {/* Create Ticket Modal */}
      <CreateTicketModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onCreateTicket={handleCreateTicket}
      />

      {editingTicket && (
        <EditTicketModal
          open={!!editingTicket}
          onOpenChange={(open) => !open && setEditingTicket(null)}
          ticket={editingTicket}
          onEditTicket={handleEditTicket}
        />
      )}

      <Dialog open={!!lightboxMedia} onOpenChange={(open) => !open && setLightboxMedia(null)}>
        <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-black/95">
          <div className="relative w-full h-[80vh]">
            {lightboxMedia && (
              <>
                <Image src={lightboxMedia || "/placeholder.svg"} alt="Full size view" fill className="object-contain" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => setLightboxMedia(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
