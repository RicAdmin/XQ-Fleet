"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock, CheckCircle, XCircle } from "lucide-react"
import { format } from "date-fns"
import { useUser } from "@/lib/user-context"
import { useToast } from "@/hooks/use-toast"

interface ExtendHourRequest {
  id: string
  jobId: string
  customerName: string
  currentReturnDate: string
  currentReturnTime: string
  requestedDate: string
  requestedTime: string
  extendedHours: number
  estimatedCost: number
  status: "Pending" | "Approved" | "Rejected"
  requestDate: string
  isPeak: boolean
}

const mockRequests: ExtendHourRequest[] = [
  {
    id: "1",
    jobId: "JOB-2025-001",
    customerName: "John Smith",
    currentReturnDate: "2025-01-15",
    currentReturnTime: "18:00",
    requestedDate: "2025-01-16",
    requestedTime: "10:00",
    extendedHours: 16,
    estimatedCost: 240,
    status: "Pending",
    requestDate: "2025-01-14T10:30:00",
    isPeak: true,
  },
  {
    id: "2",
    jobId: "JOB-2025-003",
    customerName: "Sarah Johnson",
    currentReturnDate: "2025-01-14",
    currentReturnTime: "20:00",
    requestedDate: "2025-01-15",
    requestedTime: "14:00",
    extendedHours: 18,
    estimatedCost: 270,
    status: "Pending",
    requestDate: "2025-01-14T08:15:00",
    isPeak: true,
  },
  {
    id: "3",
    jobId: "JOB-2025-007",
    customerName: "Michael Chen",
    currentReturnDate: "2025-01-13",
    currentReturnTime: "16:00",
    requestedDate: "2025-01-14",
    requestedTime: "09:00",
    extendedHours: 17,
    estimatedCost: 255,
    status: "Approved",
    requestDate: "2025-01-13T14:20:00",
    isPeak: true,
  },
]

export function ExtendHourRequestsTable() {
  const [requests, setRequests] = useState<ExtendHourRequest[]>(mockRequests)
  const { currentUser } = useUser()
  const { toast } = useToast()

  const isOperatorOrAdmin =
    currentUser?.role === "Operation" || currentUser?.role === "Customer Care" || currentUser?.role === "Super Admin"

  const handleApprove = (requestId: string) => {
    setRequests(requests.map((req) => (req.id === requestId ? { ...req, status: "Approved" as const } : req)))
    toast({
      title: "Request Approved",
      description: "The extend hour request has been approved successfully.",
    })
  }

  const handleReject = (requestId: string) => {
    setRequests(requests.map((req) => (req.id === requestId ? { ...req, status: "Rejected" as const } : req)))
    toast({
      title: "Request Rejected",
      description: "The extend hour request has been rejected.",
      variant: "destructive",
    })
  }

  const statusColors = {
    Pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
    Approved: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
    Rejected: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  }

  const pendingRequests = requests.filter((req) => req.status === "Pending")

  return (
    <Card className="glass-card rounded-2xl shadow-xl border-white/20 overflow-hidden">
      <CardHeader className="pb-4 sm:pb-5 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20 p-4 sm:p-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl font-bold">Extend Hour Requests</CardTitle>
              {pendingRequests.length > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {pendingRequests.length} pending request{pendingRequests.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#FF8945] hover:text-[#FF8945]/80 hover:bg-[#FF8945]/10 font-semibold h-9"
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="overflow-x-auto scrollbar-thin">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold whitespace-nowrap text-xs">Job ID</TableHead>
                <TableHead className="font-semibold whitespace-nowrap text-xs">Customer</TableHead>
                <TableHead className="font-semibold whitespace-nowrap text-xs">Current Return</TableHead>
                <TableHead className="font-semibold whitespace-nowrap text-xs">Requested Return</TableHead>
                <TableHead className="font-semibold whitespace-nowrap text-xs">Hours</TableHead>
                <TableHead className="font-semibold whitespace-nowrap text-xs">Session</TableHead>
                <TableHead className="font-semibold whitespace-nowrap text-xs text-right">Est. Cost</TableHead>
                <TableHead className="font-semibold whitespace-nowrap text-xs">Status</TableHead>
                <TableHead className="font-semibold whitespace-nowrap text-xs">Requested</TableHead>
                {isOperatorOrAdmin && (
                  <TableHead className="font-semibold whitespace-nowrap text-xs text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isOperatorOrAdmin ? 10 : 9}
                    className="text-center py-8 text-muted-foreground text-sm"
                  >
                    No extend hour requests
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow key={request.id} className="hover:bg-accent/30 transition-colors">
                    <TableCell className="font-mono font-semibold text-xs whitespace-nowrap">{request.jobId}</TableCell>
                    <TableCell className="text-xs">
                      <span className="truncate max-w-[120px] inline-block">{request.customerName}</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(`${request.currentReturnDate}T${request.currentReturnTime}`), "MMM d, h:mm a")}
                    </TableCell>
                    <TableCell className="text-xs font-medium whitespace-nowrap">
                      {format(new Date(`${request.requestedDate}T${request.requestedTime}`), "MMM d, h:mm a")}
                    </TableCell>
                    <TableCell className="text-xs font-semibold">{request.extendedHours}h</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          request.isPeak
                            ? "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20 text-[10px]"
                            : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 text-[10px]"
                        }
                      >
                        {request.isPeak ? "Peak" : "Low"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-right text-green-600 dark:text-green-400">
                      ${request.estimatedCost}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${statusColors[request.status]} text-[10px] font-medium`}>
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(request.requestDate), "MMM d, h:mm a")}
                    </TableCell>
                    {isOperatorOrAdmin && (
                      <TableCell>
                        {request.status === "Pending" && (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-green-500/10 hover:text-green-600"
                              onClick={() => handleApprove(request.id)}
                              title="Approve"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-red-500/10 hover:text-red-600"
                              onClick={() => handleReject(request.id)}
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
