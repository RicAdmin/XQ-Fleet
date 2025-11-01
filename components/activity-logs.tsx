"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, RefreshCw, CheckCircle, CalendarIcon, Download, LogIn, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import Image from "next/image"
import { useUser, type AccessLog } from "@/lib/user-context"

type EventType = "Pickup" | "Return" | "Wash" | "Maintenance" | "Ticket"

type DateFilter = "today" | "1-3days" | "1week" | "1month" | "1year" | "custom"

interface Activity {
  id: string
  eventType: EventType
  orderId: string
  customerName: string
  carPlate: string
  carModel: string
  carImage: string
  loggedTime: string
  pickupTime?: string
  returnTime?: string
  notes: string
  handledBy: string
}

const mockActivities: Activity[] = [
  {
    id: "1",
    eventType: "Pickup",
    orderId: "BK-2025-001",
    customerName: "John Smith",
    carPlate: "WXY 1234",
    carModel: "Toyota Camry",
    carImage: "/toyota-camry-sedan.png",
    loggedTime: "2025-01-09T09:30:00",
    pickupTime: "2025-01-09T09:30:00",
    notes: "Customer confirmed pickup. Vehicle inspected and ready.",
    handledBy: "Sarah Johnson",
  },
  {
    id: "2",
    eventType: "Return",
    orderId: "BK-2025-002",
    customerName: "Michael Chen",
    carPlate: "ABC 5678",
    carModel: "Honda Odyssey",
    carImage: "/honda-odyssey-mpv.jpg",
    loggedTime: "2025-01-09T14:15:00",
    returnTime: "2025-01-09T14:15:00",
    notes: "Client confirmed return. No damages reported.",
    handledBy: "David Wilson",
  },
  {
    id: "3",
    eventType: "Wash",
    orderId: "WS-2025-001",
    customerName: "N/A",
    carPlate: "DEF 9012",
    carModel: "Ford Explorer",
    carImage: "/ford-explorer-suv.jpg",
    loggedTime: "2025-01-09T11:00:00",
    notes: "Scheduled wash completed. Vehicle ready for next booking.",
    handledBy: "Clean Pro Services",
  },
  {
    id: "4",
    eventType: "Maintenance",
    orderId: "MT-2025-001",
    customerName: "N/A",
    carPlate: "GHI 3456",
    carModel: "Nissan Altima",
    carImage: "/nissan-altima-sedan.jpg",
    loggedTime: "2025-01-08T16:30:00",
    notes: "Oil change and tire rotation completed.",
    handledBy: "Auto Care Center",
  },
  {
    id: "5",
    eventType: "Ticket",
    orderId: "TKT-2025-001",
    customerName: "Emily Davis",
    carPlate: "JKL 7890",
    carModel: "Chevrolet Tahoe",
    carImage: "/chevrolet-tahoe-suv.jpg",
    loggedTime: "2025-01-08T10:45:00",
    notes: "Customer reported AC issue. Ticket created for investigation.",
    handledBy: "John Staff",
  },
  {
    id: "6",
    eventType: "Pickup",
    orderId: "BK-2025-003",
    customerName: "Sarah Williams",
    carPlate: "MNO 2468",
    carModel: "Toyota Camry",
    carImage: "/toyota-camry-sedan.png",
    loggedTime: "2025-01-08T08:00:00",
    pickupTime: "2025-01-08T08:00:00",
    notes: "Early morning pickup. Customer satisfied with vehicle condition.",
    handledBy: "Sarah Johnson",
  },
  {
    id: "7",
    eventType: "Return",
    orderId: "BK-2025-004",
    customerName: "Robert Brown",
    carPlate: "PQR 1357",
    carModel: "Honda Odyssey",
    carImage: "/honda-odyssey-mpv.jpg",
    loggedTime: "2025-01-07T17:30:00",
    returnTime: "2025-01-07T17:30:00",
    notes: "Late return. Additional charges applied.",
    handledBy: "David Wilson",
  },
  {
    id: "8",
    eventType: "Wash",
    orderId: "WS-2025-002",
    customerName: "N/A",
    carPlate: "STU 9753",
    carModel: "Ford Explorer",
    carImage: "/ford-explorer-suv.jpg",
    loggedTime: "2025-01-07T13:00:00",
    notes: "Deep cleaning completed after long-term rental.",
    handledBy: "Clean Pro Services",
  },
]

const eventTypeColors: Record<EventType, string> = {
  Pickup: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  Return: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  Wash: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20",
  Maintenance: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  Ticket: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
}

export function ActivityLogs() {
  const { getAccessLogs } = useUser()
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([])
  const [activities, setActivities] = useState<Activity[]>(mockActivities)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<DateFilter>("today")
  const [customDateFrom, setCustomDateFrom] = useState<Date>()
  const [customDateTo, setCustomDateTo] = useState<Date>()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    setAccessLogs(getAccessLogs())
  }, [getAccessLogs])

  const handleRefresh = () => {
    setIsRefreshing(true)
    setAccessLogs(getAccessLogs())
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }

  const handleExportCSV = () => {
    if (activeTab === "access") {
      const headers = ["User Name", "Email", "Role", "Action", "Timestamp", "IP Address", "Device"]
      const csvData = accessLogs.map((log) => [
        log.userName,
        log.userEmail,
        log.userRole,
        log.action,
        new Date(log.timestamp).toLocaleString(),
        log.ipAddress,
        log.device,
      ])

      const csvContent = [headers.join(","), ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(","))].join(
        "\n",
      )

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `access_logs_${format(new Date(), "yyyy-MM-dd")}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      const headers = [
        "Event Type",
        "Order ID",
        "Customer Name",
        "Car Plate",
        "Car Model",
        "Logged Time",
        "Notes",
        "Handled By",
      ]
      const csvData = activities.map((activity) => [
        activity.eventType,
        activity.orderId,
        activity.customerName,
        activity.carPlate,
        activity.carModel,
        new Date(activity.loggedTime).toLocaleString(),
        activity.notes,
        activity.handledBy,
      ])

      const csvContent = [headers.join(","), ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(","))].join(
        "\n",
      )

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `activities_${format(new Date(), "yyyy-MM-dd")}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const isDateInRange = (dateStr: string): boolean => {
    const activityDate = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    switch (dateFilter) {
      case "today":
        const todayEnd = new Date(today)
        todayEnd.setHours(23, 59, 59, 999)
        return activityDate >= today && activityDate <= todayEnd

      case "1-3days":
        const threeDaysAgo = new Date(today)
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
        return activityDate >= threeDaysAgo && activityDate <= today

      case "1week":
        const oneWeekAgo = new Date(today)
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        return activityDate >= oneWeekAgo && activityDate <= today

      case "1month":
        const oneMonthAgo = new Date(today)
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
        return activityDate >= oneMonthAgo && activityDate <= today

      case "1year":
        const oneYearAgo = new Date(today)
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
        return activityDate >= oneYearAgo && activityDate <= today

      case "custom":
        if (!customDateFrom || !customDateTo) return true
        const fromDate = new Date(customDateFrom)
        fromDate.setHours(0, 0, 0, 0)
        const toDate = new Date(customDateTo)
        toDate.setHours(23, 59, 59, 999)
        return activityDate >= fromDate && activityDate <= toDate

      default:
        return true
    }
  }

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.carPlate.toLowerCase().includes(searchQuery.toLowerCase())

    let matchesTab = true
    if (activeTab !== "all" && activeTab !== "access") {
      if (activeTab === "jobs") {
        matchesTab = activity.eventType === "Pickup" || activity.eventType === "Return"
      } else {
        matchesTab = activity.eventType.toLowerCase() === activeTab.toLowerCase()
      }
    }

    const matchesDate = isDateInRange(activity.loggedTime)

    return matchesSearch && matchesTab && matchesDate
  })

  const filteredAccessLogs = accessLogs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userRole.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesDate = isDateInRange(log.timestamp)

    return matchesSearch && matchesDate
  })

  const groupedActivities = filteredActivities.reduce(
    (groups, activity) => {
      const date = new Date(activity.loggedTime).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(activity)
      return groups
    },
    {} as Record<string, Activity[]>,
  )

  const groupedAccessLogs = filteredAccessLogs.reduce(
    (groups, log) => {
      const date = new Date(log.timestamp).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(log)
      return groups
    },
    {} as Record<string, AccessLog[]>,
  )

  return (
    <div className="p-4 sm:p-6 space-y-4 pb-24 lg:pb-6">
      <Card className="rounded-xl p-4 glass-card border-white/40">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">Filter by Time</h3>

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
              variant={dateFilter === "1month" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateFilter("1month")}
              className={cn(
                "h-9 transition-all duration-200",
                dateFilter === "1month" && "bg-[#FF8945] hover:bg-[#FF8945]/90 text-white shadow-sm",
              )}
            >
              1 Month
            </Button>
            <Button
              variant={dateFilter === "1year" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateFilter("1year")}
              className={cn(
                "h-9 transition-all duration-200",
                dateFilter === "1year" && "bg-[#FF8945] hover:bg-[#FF8945]/90 text-white shadow-sm",
              )}
            >
              1 Year
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
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={
                  activeTab === "access"
                    ? "Search by user name, email, or role..."
                    : "Search by order number, client name, or car plate..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="default" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="default" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="w-full">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="jobs">Jobs</TabsTrigger>
                <TabsTrigger value="pickup">Pickups</TabsTrigger>
                <TabsTrigger value="return">Returns</TabsTrigger>
                <TabsTrigger value="wash">Wash</TabsTrigger>
                <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                <TabsTrigger value="ticket">Tickets</TabsTrigger>
                <TabsTrigger value="access">Access</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </Card>

      <div>
        <p className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-semibold text-foreground">
            {activeTab === "access" ? filteredAccessLogs.length : filteredActivities.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-foreground">
            {activeTab === "access" ? accessLogs.length : activities.length}
          </span>{" "}
          {activeTab === "access" ? "access logs" : "activities"}
        </p>
      </div>

      {activeTab === "access" ? (
        filteredAccessLogs.length === 0 ? (
          <Card className="rounded-xl p-12 glass-card border-white/40">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <h3 className="text-xl font-semibold text-foreground">No Access Logs</h3>
              <p className="text-muted-foreground max-w-md">
                No access logs found for the selected filters. Sign in and sign out events will appear here.
              </p>
            </div>
          </Card>
        ) : (
          <Card className="rounded-xl overflow-hidden glass-card border-white/40">
            <div className="overflow-x-auto scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold whitespace-nowrap">Action & User</TableHead>
                    <TableHead className="font-semibold whitespace-nowrap">Email & Role</TableHead>
                    <TableHead className="font-semibold whitespace-nowrap">Time & Device</TableHead>
                    <TableHead className="font-semibold whitespace-nowrap">IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccessLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-accent/30 transition-colors">
                      <TableCell>
                        <div className="space-y-1">
                          <Badge
                            variant="outline"
                            className={cn(
                              "whitespace-nowrap",
                              log.action === "Sign In"
                                ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                                : "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
                            )}
                          >
                            {log.action === "Sign In" ? (
                              <LogIn className="h-3 w-3 mr-1" />
                            ) : (
                              <LogOut className="h-3 w-3 mr-1" />
                            )}
                            {log.action}
                          </Badge>
                          <div className="font-medium text-sm">{log.userName}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">{log.userEmail}</div>
                          <Badge variant="secondary" className="text-xs whitespace-nowrap">
                            {log.userRole}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </div>
                          <div className="text-xs text-muted-foreground">{log.device}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">{log.ipAddress}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )
      ) : filteredActivities.length === 0 ? (
        <Card className="rounded-xl p-12 glass-card border-white/40">
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <h3 className="text-xl font-semibold text-foreground">All Clear</h3>
            <p className="text-muted-foreground max-w-md">
              No activities found for the selected filters. All operations are up to date.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="rounded-xl overflow-hidden glass-card border-white/40">
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-semibold whitespace-nowrap">Event & Order</TableHead>
                  <TableHead className="font-semibold whitespace-nowrap">Customer & Vehicle</TableHead>
                  <TableHead className="font-semibold whitespace-nowrap">Time & Handler</TableHead>
                  <TableHead className="font-semibold">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.map((activity) => (
                  <TableRow key={activity.id} className="hover:bg-accent/30 transition-colors">
                    <TableCell>
                      <div className="space-y-1.5">
                        <Badge
                          variant="outline"
                          className={cn("whitespace-nowrap", eventTypeColors[activity.eventType])}
                        >
                          {activity.eventType}
                        </Badge>
                        <div className="font-mono text-xs font-semibold">{activity.orderId}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <Image
                            src={activity.carImage || "/placeholder.svg"}
                            alt={activity.carModel}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="font-medium text-sm">{activity.customerName}</div>
                          <div className="text-xs font-semibold text-foreground">{activity.carPlate}</div>
                          <div className="text-xs text-muted-foreground">{activity.carModel}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm whitespace-nowrap">
                          {new Date(activity.loggedTime).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground">by {activity.handledBy}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-muted-foreground whitespace-normal break-words">{activity.notes}</p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  )
}
