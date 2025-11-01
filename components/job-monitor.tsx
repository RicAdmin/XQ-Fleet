"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock, MapPin, User, Car, ArrowRight, Calendar, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

type EventType = "Pickup" | "Return"
type EventStatus = "Upcoming" | "In Progress" | "Completed" | "Delayed"

interface MonitorEvent {
  id: string
  jobId: string
  type: EventType
  scheduledTime: Date
  customerName: string
  carName: string
  carPlate: string
  location: string
  status: EventStatus
  contactNumber: string
}

// Mock data generator for current day events (with 6-hour buffer)
function generateTodayEvents(): MonitorEvent[] {
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  todayStart.setHours(todayStart.getHours() - 6) // 6 hours before midnight

  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)
  todayEnd.setHours(todayEnd.getHours() + 6) // 6 hours after midnight

  const events: MonitorEvent[] = [
    {
      id: "1",
      jobId: "J-2025-045",
      type: "Pickup",
      scheduledTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 30),
      customerName: "John Smith",
      carName: "Toyota Vios 3G",
      carPlate: "TOY-1234",
      location: "Kuah Airport",
      status: "Completed",
      contactNumber: "+60 12-345 6789",
    },
    {
      id: "2",
      jobId: "J-2025-046",
      type: "Return",
      scheduledTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0),
      customerName: "Sarah Johnson",
      carName: "Honda Odyssey",
      carPlate: "HON-5678",
      location: "Pantai Cenang",
      status: "Completed",
      contactNumber: "+60 12-987 6543",
    },
    {
      id: "3",
      jobId: "J-2025-047",
      type: "Pickup",
      scheduledTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 30),
      customerName: "Michael Chen",
      carName: "Toyota Avanza",
      carPlate: "TOY-9012",
      location: "Kuah Jetty",
      status: "In Progress",
      contactNumber: "+60 13-456 7890",
    },
    {
      id: "4",
      jobId: "J-2025-048",
      type: "Pickup",
      scheduledTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0),
      customerName: "Emily Davis",
      carName: "Perodua Alza",
      carPlate: "PER-3456",
      location: "Kuah Airport",
      status: "Upcoming",
      contactNumber: "+60 14-567 8901",
    },
    {
      id: "5",
      jobId: "J-2025-049",
      type: "Return",
      scheduledTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 30),
      customerName: "David Wilson",
      carName: "Suzuki Jimny",
      carPlate: "SUZ-7890",
      location: "Pantai Cenang",
      status: "Upcoming",
      contactNumber: "+60 15-678 9012",
    },
    {
      id: "6",
      jobId: "J-2025-050",
      type: "Pickup",
      scheduledTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 45),
      customerName: "Lisa Anderson",
      carName: "Toyota Innova",
      carPlate: "TOY-2345",
      location: "Kuah Jetty",
      status: "Upcoming",
      contactNumber: "+60 16-789 0123",
    },
    {
      id: "7",
      jobId: "J-2025-051",
      type: "Return",
      scheduledTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0),
      customerName: "Robert Brown",
      carName: "Perodua Bezza",
      carPlate: "PER-6789",
      location: "Kuah Airport",
      status: "Upcoming",
      contactNumber: "+60 17-890 1234",
    },
    {
      id: "8",
      jobId: "J-2025-052",
      type: "Pickup",
      scheduledTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 30),
      customerName: "Jennifer Lee",
      carName: "Toyota Veloz",
      carPlate: "TOY-4567",
      location: "Pantai Cenang",
      status: "Upcoming",
      contactNumber: "+60 18-901 2345",
    },
    {
      id: "9",
      jobId: "J-2025-044",
      type: "Return",
      scheduledTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 45),
      customerName: "James Taylor",
      carName: "Perodua Axia",
      carPlate: "PER-8901",
      location: "Kuah Jetty",
      status: "Upcoming",
      contactNumber: "+60 19-012 3456",
    },
    {
      id: "10",
      jobId: "J-2025-043",
      type: "Pickup",
      scheduledTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 22, 30),
      customerName: "Maria Garcia",
      carName: "Mini Convertible",
      carPlate: "MIN-1111",
      location: "Kuah Airport",
      status: "Completed",
      contactNumber: "+60 11-234 5678",
    },
  ]

  return events.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime())
}

const statusColors: Record<EventStatus, string> = {
  Upcoming: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  "In Progress": "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  Completed: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  Delayed: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
}

const typeColors: Record<EventType, string> = {
  Pickup: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  Return: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
}

export function JobMonitor() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [events] = useState<MonitorEvent[]>(generateTodayEvents())
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const getDayLabel = (date: Date): string => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const eventDate = new Date(date)
    eventDate.setHours(0, 0, 0, 0)

    const diffDays = Math.floor((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === -1) return "Yesterday"
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Tomorrow"
    return ""
  }

  const getTimeUntil = (scheduledTime: Date): string => {
    const diff = scheduledTime.getTime() - currentTime.getTime()
    const hours = Math.floor(Math.abs(diff) / (1000 * 60 * 60))
    const minutes = Math.floor((Math.abs(diff) % (1000 * 60 * 60)) / (1000 * 60))

    if (diff < 0) {
      return `${hours}h ${minutes}m ago`
    } else if (hours === 0) {
      return `in ${minutes}m`
    } else {
      return `in ${hours}h ${minutes}m`
    }
  }

  const pickupEvents = events.filter((e) => e.type === "Pickup")
  const returnEvents = events.filter((e) => e.type === "Return")

  const toggleRowExpansion = (eventId: string) => {
    setExpandedRowId(expandedRowId === eventId ? null : eventId)
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-24 lg:pb-6">
      <Card className="rounded-xl p-4 sm:p-6 glass-card border-white/40 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 w-full md:w-auto">
            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg flex-shrink-0">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Job Monitor</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Real-time pickup and return schedule</p>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end gap-1 w-full md:w-auto">
            <div className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums tracking-tight">
              {currentTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
              })}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground text-center md:text-right">
              {currentTime.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-xl p-3 sm:p-4 glass-card border-white/40">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 rotate-[-45deg]" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-foreground">{pickupEvents.length}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Pickups Today</p>
            </div>
          </div>
        </Card>
        <Card className="rounded-xl p-3 sm:p-4 glass-card border-white/40">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 rotate-[135deg]" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-foreground">{returnEvents.length}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Returns Today</p>
            </div>
          </div>
        </Card>
        <Card className="rounded-xl p-3 sm:p-4 glass-card border-white/40">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-foreground">
                {events.filter((e) => e.status === "In Progress").length}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">In Progress</p>
            </div>
          </div>
        </Card>
        <Card className="rounded-xl p-3 sm:p-4 glass-card border-white/40">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-foreground">
                {events.filter((e) => e.status === "Upcoming").length}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Upcoming</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="rounded-xl overflow-hidden glass-card border-white/40">
        <div className="overflow-x-auto scrollbar-thin">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold whitespace-nowrap w-[140px] sm:w-[180px] sticky left-0 bg-muted/30 z-10">
                  Date
                </TableHead>
                <TableHead className="font-semibold whitespace-nowrap w-[80px] sm:w-[100px]">Time</TableHead>
                <TableHead className="font-semibold whitespace-nowrap w-[70px] sm:w-[80px]">Type</TableHead>
                <TableHead className="font-semibold whitespace-nowrap w-[100px] sm:w-[120px] hidden sm:table-cell">
                  Job ID
                </TableHead>
                <TableHead className="font-semibold whitespace-nowrap">Customer</TableHead>
                <TableHead className="font-semibold whitespace-nowrap hidden lg:table-cell">Vehicle</TableHead>
                <TableHead className="font-semibold whitespace-nowrap hidden md:table-cell">Location</TableHead>
                <TableHead className="font-semibold whitespace-nowrap w-[100px] sm:w-[120px]">Status</TableHead>
                <TableHead className="font-semibold whitespace-nowrap w-[100px] sm:w-[120px] hidden sm:table-cell">
                  Countdown
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-16 text-muted-foreground">
                    No events scheduled for today
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => {
                  const isPast = event.scheduledTime < currentTime
                  const isNow =
                    Math.abs(event.scheduledTime.getTime() - currentTime.getTime()) < 30 * 60 * 1000 &&
                    event.status === "In Progress"
                  const dayLabel = getDayLabel(event.scheduledTime)
                  const isExpanded = expandedRowId === event.id

                  return (
                    <>
                      <TableRow
                        key={event.id}
                        className={cn(
                          "hover:bg-accent/30 transition-colors",
                          isNow && "bg-yellow-500/5 border-l-4 border-l-yellow-500",
                          "lg:cursor-default cursor-pointer",
                        )}
                        onClick={() => {
                          if (window.innerWidth < 1024) {
                            toggleRowExpansion(event.id)
                          }
                        }}
                      >
                        <TableCell className="sticky left-0 bg-background z-10">
                          <div className="flex items-start justify-between gap-2 min-w-0">
                            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                              <p className="font-medium text-xs sm:text-sm leading-tight">
                                {event.scheduledTime.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </p>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
                                  {event.scheduledTime.toLocaleDateString("en-US", {
                                    weekday: "long",
                                  })}
                                </p>
                                {dayLabel && (
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0 h-3.5 sm:h-4 leading-tight",
                                      dayLabel === "Today" && "bg-blue-500/10 text-blue-700 border-blue-500/20",
                                      dayLabel === "Yesterday" && "bg-gray-500/10 text-gray-700 border-gray-500/20",
                                      dayLabel === "Tomorrow" && "bg-green-500/10 text-green-700 border-green-500/20",
                                    )}
                                  >
                                    {dayLabel}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="lg:hidden flex-shrink-0 pt-0.5">
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono font-bold text-xs sm:text-base whitespace-nowrap align-top">
                          {event.scheduledTime.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </TableCell>
                        <TableCell className="align-top">
                          <Badge
                            variant="outline"
                            className={cn(typeColors[event.type], "font-medium whitespace-nowrap text-xs")}
                          >
                            {event.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono font-semibold whitespace-nowrap text-xs sm:text-sm hidden sm:table-cell align-top">
                          {event.jobId}
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex items-start gap-2">
                            <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-xs sm:text-sm leading-tight">{event.customerName}</p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight mt-0.5">
                                {event.contactNumber}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell align-top">
                          <div className="flex items-start gap-2">
                            <Car className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm leading-tight">{event.carName}</p>
                              <p className="text-xs text-muted-foreground font-mono leading-tight mt-0.5">
                                {event.carPlate}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell align-top">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <span className="text-sm leading-tight">{event.location}</span>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <Badge
                            variant="outline"
                            className={cn(statusColors[event.status], "font-medium whitespace-nowrap text-xs")}
                          >
                            {event.status}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={cn(
                            "font-mono text-xs sm:text-sm hidden sm:table-cell align-top",
                            isPast && "text-muted-foreground",
                          )}
                        >
                          {event.status === "Completed" ? "-" : getTimeUntil(event.scheduledTime)}
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="lg:hidden bg-muted/20">
                          <TableCell colSpan={9} className="p-0">
                            <div className="p-4 space-y-3 border-t border-border/50">
                              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 items-start">
                                <span className="text-xs font-semibold text-muted-foreground uppercase pt-0.5">
                                  Job ID
                                </span>
                                <span className="font-mono font-semibold text-sm text-right">{event.jobId}</span>

                                <span className="text-xs font-semibold text-muted-foreground uppercase pt-0.5">
                                  Vehicle
                                </span>
                                <div className="flex items-start gap-2 justify-end">
                                  <div className="text-right">
                                    <p className="font-medium text-sm leading-tight">{event.carName}</p>
                                    <p className="text-xs text-muted-foreground font-mono leading-tight mt-0.5">
                                      {event.carPlate}
                                    </p>
                                  </div>
                                  <Car className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                </div>

                                <span className="text-xs font-semibold text-muted-foreground uppercase pt-0.5">
                                  Location
                                </span>
                                <div className="flex items-start gap-2 justify-end">
                                  <span className="text-sm font-medium leading-tight text-right">{event.location}</span>
                                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                </div>

                                {event.status !== "Completed" && (
                                  <>
                                    <span className="text-xs font-semibold text-muted-foreground uppercase pt-0.5">
                                      Countdown
                                    </span>
                                    <span
                                      className={cn(
                                        "font-mono text-sm font-medium text-right",
                                        isPast && "text-muted-foreground",
                                      )}
                                    >
                                      {getTimeUntil(event.scheduledTime)}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
