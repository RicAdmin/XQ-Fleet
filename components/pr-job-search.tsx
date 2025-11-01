"use client"

import type React from "react"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, User, Phone, FileText, Calendar, Clock, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const mockJobs = [
  {
    id: "1",
    jobId: "JOB-2025-001",
    customerName: "John Smith",
    customerMobile: "+60123456789",
    carName: "Toyota Camry",
    startDate: "2025-01-10",
    startTime: "9:00 AM",
    endDate: "2025-01-15",
    endTime: "6:00 PM",
    actualStartDate: "2025-01-10",
    actualStartTime: "9:30 AM",
    actualEndDate: null,
    actualEndTime: null,
    status: "Active",
    depositAmount: 100,
    pickedUp: true,
    pickedUpBy: "Sarah Lee",
    pickedUpOn: "2025-01-10 09:30 AM",
    returned: false,
    returnedBy: null,
    returnedOn: null,
    isConfirmed: true,
  },
  {
    id: "2",
    jobId: "JOB-2025-002",
    customerName: "Sarah Johnson",
    customerMobile: "+60198765432",
    carName: "Honda Odyssey",
    startDate: "2025-01-12",
    startTime: "10:00 AM",
    endDate: "2025-01-14",
    endTime: "5:00 PM",
    actualStartDate: null,
    actualStartTime: null,
    actualEndDate: null,
    actualEndTime: null,
    status: "Pending",
    depositAmount: 150,
    pickedUp: false,
    pickedUpBy: null,
    pickedUpOn: null,
    returned: false,
    returnedBy: null,
    returnedOn: null,
    isConfirmed: false,
  },
  {
    id: "3",
    jobId: "JOB-2025-003",
    customerName: "Michael Chen",
    customerMobile: "+60187654321",
    carName: "Ford Explorer",
    startDate: "2025-01-08",
    startTime: "9:00 AM",
    endDate: "2025-01-11",
    endTime: "6:00 PM",
    actualStartDate: "2025-01-08",
    actualStartTime: "9:15 AM",
    actualEndDate: "2025-01-11",
    actualEndTime: "5:45 PM",
    status: "Completed",
    depositAmount: 150,
    pickedUp: true,
    pickedUpBy: "Sarah Lee",
    pickedUpOn: "2025-01-08 09:15 AM",
    returned: true,
    returnedBy: "Ahmad bin Ali",
    returnedOn: "2025-01-11 05:45 PM",
    isConfirmed: true,
  },
]

interface PRJobSearchProps {
  onJobSelect: (job: any, type?: "pickup" | "return") => void
  onViewConfirmation?: (job: any, type: "pickup" | "return") => void
}

export function PRJobSearch({ onJobSelect, onViewConfirmation }: PRJobSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [filter, setFilter] = useState<"all" | "pickup" | "return">("all")

  const handleSearch = () => {
    setHasSearched(true)
    let results = mockJobs.filter(
      (job) =>
        job.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.customerMobile.includes(searchQuery) ||
        job.jobId.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    if (filter === "pickup") {
      results = results.filter((job) => !job.pickedUp)
    } else if (filter === "return") {
      results = results.filter((job) => job.pickedUp && !job.returned)
    }

    setSearchResults(results)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const handleFilterChange = (value: string) => {
    setFilter(value as "all" | "pickup" | "return")
    if (hasSearched) {
      setTimeout(() => handleSearch(), 0)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Search Job</h2>

        <Tabs value={filter} onValueChange={handleFilterChange} className="mb-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pickup">Pickup</TabsTrigger>
            <TabsTrigger value="return">Return</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Customer name, mobile, or Job ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10 h-12 text-base"
            />
          </div>

          <Button onClick={handleSearch} className="w-full h-12 text-base font-semibold">
            <Search className="h-5 w-5 mr-2" />
            Search Job
          </Button>
        </div>

        <div className="mt-6 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Search by:</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              <User className="h-3 w-3 mr-1" />
              Customer Name
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Phone className="h-3 w-3 mr-1" />
              Mobile Number
            </Badge>
            <Badge variant="outline" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              Job ID
            </Badge>
          </div>
        </div>
      </Card>

      {hasSearched && (
        <div className="space-y-3">
          {searchResults.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No jobs found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try searching with a different customer name, mobile number, or Job ID
              </p>
            </Card>
          ) : (
            searchResults.map((job) => (
              <Card key={job.id} className="p-4">
                <div
                  className={!job.isConfirmed ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
                  onClick={() => !job.isConfirmed && onJobSelect(job)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-mono font-bold text-sm text-blue-600">{job.jobId}</p>
                      <p className="text-lg font-semibold text-gray-900 mt-1">{job.customerName}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        job.status === "Active"
                          ? "bg-green-500/10 text-green-700 border-green-500/20"
                          : "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
                      }
                    >
                      {job.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{job.customerMobile}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>{job.carName}</span>
                    </div>

                    <div className="pt-2 border-t space-y-1">
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 mt-0.5 text-blue-600" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">Pickup Date | Time</p>
                          <p className="text-xs text-muted-foreground">
                            Ordered:{" "}
                            {new Date(job.startDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}{" "}
                            | {job.startTime}
                          </p>
                          {job.actualStartDate && (
                            <p className="text-xs text-blue-600 font-medium">
                              Actual:{" "}
                              {new Date(job.actualStartDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}{" "}
                              | {job.actualStartTime}
                            </p>
                          )}
                          {job.pickedUp ? (
                            <p className="text-xs text-green-600 font-medium mt-1">
                              ✓ Picked Up by {job.pickedUpBy} on {job.pickedUpOn}
                            </p>
                          ) : (
                            <p className="text-xs text-orange-600 font-medium mt-1">✗ Not Yet Picked Up</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-2 pt-2">
                        <Clock className="h-4 w-4 mt-0.5 text-purple-600" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">Return Date | Time</p>
                          <p className="text-xs text-muted-foreground">
                            Ordered:{" "}
                            {new Date(job.endDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}{" "}
                            | {job.endTime}
                          </p>
                          {job.actualEndDate && (
                            <p className="text-xs text-purple-600 font-medium">
                              Actual:{" "}
                              {new Date(job.actualEndDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}{" "}
                              | {job.actualEndTime}
                            </p>
                          )}
                          {job.returned ? (
                            <p className="text-xs text-green-600 font-medium mt-1">
                              ✓ Returned by {job.returnedBy} on {job.returnedOn}
                            </p>
                          ) : (
                            <p className="text-xs text-orange-600 font-medium mt-1">✗ Not Yet Returned</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm font-semibold text-gray-900">Deposit: ${job.depositAmount}</span>
                      {job.isConfirmed && (
                        <Badge variant="secondary" className="text-xs">
                          Confirmed
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2 mt-3">
                      {/* Process Pickup button - show when pickup not done yet */}
                      {!job.pickedUp && (
                        <Button
                          onClick={() => onJobSelect(job, "pickup")}
                          className="flex-1 h-10 bg-blue-600 hover:bg-blue-700"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Process Pickup
                        </Button>
                      )}

                      {/* Process Return button - show when pickup done but return not done yet */}
                      {job.pickedUp && !job.returned && (
                        <Button
                          onClick={() => onJobSelect(job, "return")}
                          className="flex-1 h-10 bg-purple-600 hover:bg-purple-700"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Process Return
                        </Button>
                      )}

                      {/* View Cfm Pickup button - show when pickup is confirmed */}
                      {job.pickedUp && onViewConfirmation && (
                        <Button
                          onClick={() => onViewConfirmation(job, "pickup")}
                          variant="outline"
                          className="flex-1 h-10"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Cfm Pickup
                        </Button>
                      )}

                      {/* View Cfm Return button - show when return is confirmed */}
                      {job.returned && onViewConfirmation && (
                        <Button
                          onClick={() => onViewConfirmation(job, "return")}
                          variant="outline"
                          className="flex-1 h-10"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Cfm Return
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
