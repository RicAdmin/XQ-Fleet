"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Download, CalendarIcon } from "lucide-react"
import { EditCustomerModal } from "@/components/edit-customer-modal"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  totalBookings: number
  lastJobId: string | null
  lastJobDate: string | null
  status: "Active" | "Inactive"
  createdDate: string
  ticketsCreated: number
}

type DateFilter = "all" | "today" | "1week" | "1month" | "1year" | "custom"

export function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: "1",
      name: "Ahmad Hassan",
      email: "ahmad.hassan@email.com",
      phone: "+60 12-345 6789",
      totalBookings: 12,
      lastJobId: "JOB-2025-045",
      lastJobDate: "2025-01-05",
      status: "Active",
      createdDate: "2024-03-15",
      ticketsCreated: 3,
    },
    {
      id: "2",
      name: "Sarah Lee",
      email: "sarah.lee@email.com",
      phone: "+60 11-234 5678",
      totalBookings: 8,
      lastJobId: "JOB-2025-052",
      lastJobDate: "2025-01-08",
      status: "Active",
      createdDate: "2024-05-20",
      ticketsCreated: 1,
    },
    {
      id: "3",
      name: "John Tan",
      email: "john.tan@email.com",
      phone: "+60 13-456 7890",
      totalBookings: 5,
      lastJobId: "JOB-2024-198",
      lastJobDate: "2024-12-20",
      status: "Inactive",
      createdDate: "2024-01-10",
      ticketsCreated: 0,
    },
    {
      id: "4",
      name: "Emily Wong",
      email: "emily.wong@email.com",
      phone: "+60 14-567 8901",
      totalBookings: 15,
      lastJobId: "JOB-2025-060",
      lastJobDate: "2025-01-09",
      status: "Active",
      createdDate: "2023-11-05",
      ticketsCreated: 5,
    },
    {
      id: "5",
      name: "Michael Lim",
      email: "michael.lim@email.com",
      phone: "+60 16-678 9012",
      totalBookings: 0,
      lastJobId: null,
      lastJobDate: null,
      status: "Active",
      createdDate: "2025-01-02",
      ticketsCreated: 0,
    },
  ])

  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState<DateFilter>("all")
  const [customDateFrom, setCustomDateFrom] = useState<Date>()
  const [customDateTo, setCustomDateTo] = useState<Date>()
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const isDateInRange = (dateStr: string): boolean => {
    const createdDate = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    switch (dateFilter) {
      case "all":
        return true

      case "today":
        const todayEnd = new Date(today)
        todayEnd.setHours(23, 59, 59, 999)
        return createdDate >= today && createdDate <= todayEnd

      case "1week":
        const oneWeekAgo = new Date(today)
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        return createdDate >= oneWeekAgo && createdDate <= today

      case "1month":
        const oneMonthAgo = new Date(today)
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
        return createdDate >= oneMonthAgo && createdDate <= today

      case "1year":
        const oneYearAgo = new Date(today)
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
        return createdDate >= oneYearAgo && createdDate <= today

      case "custom":
        if (!customDateFrom || !customDateTo) return true
        const fromDate = new Date(customDateFrom)
        fromDate.setHours(0, 0, 0, 0)
        const toDate = new Date(customDateTo)
        toDate.setHours(23, 59, 59, 999)
        return createdDate >= fromDate && createdDate <= toDate

      default:
        return true
    }
  }

  const filteredCustomers = customers
    .filter((customer) => {
      const matchesSearch =
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery) ||
        customer.id.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesDateFilter = isDateInRange(customer.createdDate)

      return matchesSearch && matchesDateFilter
    })
    .sort((a, b) => {
      // Sort by created date desc first
      const dateCompare = new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
      if (dateCompare !== 0) return dateCompare

      // Then sort by name A-Z
      return a.name.localeCompare(b.name)
    })

  const exportToCSV = () => {
    const headers = ["ID", "Name", "Email", "Phone", "Created Date", "Total Jobs", "Last Job", "Tickets", "Status"]
    const rows = filteredCustomers.map((customer) => [
      customer.id,
      customer.name,
      customer.email,
      customer.phone,
      customer.createdDate,
      customer.totalBookings,
      customer.lastJobId || "N/A",
      customer.ticketsCreated,
      customer.status,
    ])

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `customers-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsEditModalOpen(true)
  }

  const handleSaveCustomer = (updatedCustomer: Customer) => {
    setCustomers(customers.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c)))
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 pb-24 lg:pb-6">
      <Card className="rounded-xl p-4 glass-card border-white/40">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">Filter by Customer Created On</h3>

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
              All Time
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
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>

          <Button onClick={exportToCSV} variant="outline" className="w-full sm:w-auto h-10 bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            Export to CSV
          </Button>
        </div>
      </Card>

      <div>
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredCustomers.length}</span> of{" "}
          <span className="font-semibold text-foreground">{customers.length}</span> customers
        </p>
      </div>

      <Card className="rounded-xl overflow-hidden glass-card border-white/40">
        <div className="overflow-x-auto scrollbar-thin">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold whitespace-nowrap">Customer</TableHead>
                <TableHead className="font-semibold whitespace-nowrap">Contact</TableHead>
                <TableHead className="font-semibold whitespace-nowrap">Created Date</TableHead>
                <TableHead className="font-semibold whitespace-nowrap">Total Jobs</TableHead>
                <TableHead className="font-semibold whitespace-nowrap">Last Job</TableHead>
                <TableHead className="font-semibold whitespace-nowrap">Tickets</TableHead>
                <TableHead className="font-semibold whitespace-nowrap">Status</TableHead>
                <TableHead className="font-semibold whitespace-nowrap text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                    No customers found matching your filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-accent/30 transition-colors">
                    <TableCell>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">ID: {customer.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm">{customer.email}</p>
                        <p className="text-xs text-muted-foreground">{customer.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {new Date(customer.createdDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-medium">
                        {customer.totalBookings}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {customer.lastJobId ? (
                        <div>
                          <p className="font-mono text-sm font-medium">{customer.lastJobId}</p>
                          <p className="text-xs text-muted-foreground">
                            {customer.lastJobDate &&
                              new Date(customer.lastJobDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No jobs yet</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-medium">
                        {customer.ticketsCreated}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          customer.status === "Active"
                            ? "bg-green-500/10 text-green-700 border-green-500/20"
                            : "bg-gray-500/10 text-gray-700 border-gray-500/20"
                        }
                      >
                        {customer.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditCustomer(customer)
                        }}
                        className="h-8 px-3 hover:bg-accent"
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <EditCustomerModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        customer={selectedCustomer}
        onSave={handleSaveCustomer}
      />
    </div>
  )
}
