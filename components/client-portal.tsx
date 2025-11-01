"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  MapPin,
  Calendar,
  Clock,
  Phone,
  Mail,
  CheckCircle,
  LogOut,
  Upload,
  X,
  Check,
  Undo2,
  Baby,
  Users,
  MessageSquare,
  User,
  ChevronDown,
  ChevronUp,
  Gift,
  Map,
  Fuel,
  Shield,
} from "lucide-react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { ClientExtendHourModal } from "@/components/client-extend-hour-modal"

interface ClientPortalProps {
  jobId: string
  mobileNumber: string
  onLogout: () => void
}

export function ClientPortal({ jobId, mobileNumber, onLogout }: ClientPortalProps) {
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false)
  const [isExtendHourOpen, setIsExtendHourOpen] = useState(false)
  const [isBenefitsOpen, setIsBenefitsOpen] = useState(false) // Added state for Benefits drawer
  const [ticketType, setTicketType] = useState("")
  const [ticketDescription, setTicketDescription] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null)

  const [pickupStatus, setPickupStatus] = useState<"pending" | "completed">("pending")
  const [returnStatus, setReturnStatus] = useState<"pending" | "completed">("pending")
  const [showPickupUndo, setShowPickupUndo] = useState(false)
  const [showReturnUndo, setShowReturnUndo] = useState(false)

  // Mock job data - in real app, this would be fetched based on jobId and mobileNumber
  const jobData = {
    id: jobId,
    status: "Active",
    customer: {
      name: "John Smith",
      email: "john.smith@email.com",
      phone: mobileNumber,
    },
    car: {
      name: "TOYOTA VIOS 3G (FACELIFT)",
      plate: "WXY 1234",
      image: "/toyota-vios-3g-facelift.png",
      category: "Sedan",
      passengers: 5,
      fuelType: "Petrol",
    },
    addOns: {
      babySeat: true,
      secondDriver: false,
    },
    pickup: {
      date: "2025-01-15",
      time: "10:00 AM",
      location: "KLIA Terminal 1",
    },
    return: {
      date: "2025-01-20",
      time: "10:00 AM",
      location: "KLIA Terminal 1",
    },
    totalAmount: 750,
    rentDays: 5,
  }

  // Mock ticket data for the job
  const jobTickets = [
    {
      id: "TKT-001",
      type: "Accident",
      severity: "High",
      status: "In Progress",
      description: "Minor scratch on the front bumper from parking incident.",
      submittedDate: "2025-01-16T10:30:00",
      assignedPIC: "Sarah Johnson",
      responses: [
        {
          from: "Sarah Johnson",
          message: "Thank you for reporting this. We've received your ticket and will assess the damage shortly.",
          timestamp: "2025-01-16T11:00:00",
        },
        {
          from: "Sarah Johnson",
          message:
            "Our team has reviewed the photos. The repair cost will be covered by insurance. No action needed from your side.",
          timestamp: "2025-01-16T14:30:00",
        },
      ],
    },
    {
      id: "TKT-002",
      type: "Extend Hour",
      severity: "Medium",
      status: "Resolved",
      description: "Need to extend rental by 3 hours due to flight delay.",
      submittedDate: "2025-01-17T08:15:00",
      assignedPIC: "Mike Chen",
      responses: [
        {
          from: "Mike Chen",
          message: "Extension approved! You can keep the car for 3 additional hours at RM15/hour. Total: RM45.",
          timestamp: "2025-01-17T08:30:00",
        },
      ],
    },
  ]

  const handlePickupComplete = () => {
    setPickupStatus("completed")
    setShowPickupUndo(true)
    setTimeout(() => setShowPickupUndo(false), 5000)
  }

  const handlePickupUndo = () => {
    setPickupStatus("pending")
    setShowPickupUndo(false)
  }

  const handleReturnComplete = () => {
    setReturnStatus("completed")
    setShowReturnUndo(true)
    setTimeout(() => setShowReturnUndo(false), 5000)
  }

  const handleReturnUndo = () => {
    setReturnStatus("pending")
    setShowReturnUndo(false)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newFiles = Array.from(files).map((file) => URL.createObjectURL(file))
      setUploadedFiles([...uploadedFiles, ...newFiles])
    }
  }

  const handleSubmitTicket = () => {
    console.log("Submitting ticket:", {
      jobId,
      type: ticketType,
      description: ticketDescription,
      files: uploadedFiles,
    })
    setIsCreateTicketOpen(false)
    setTicketType("")
    setTicketDescription("")
    setUploadedFiles([])
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "resolved":
        return "bg-green-500/10 text-green-700 border-green-500/20"
      case "in progress":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20"
      case "pending":
        return "bg-amber-500/10 text-amber-700 border-amber-500/20"
      default:
        return "bg-muted/50 text-muted-foreground border-border"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high":
        return "bg-red-500/10 text-red-700 border-red-500/20"
      case "medium":
        return "bg-amber-500/10 text-amber-700 border-amber-500/20"
      case "low":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20"
      default:
        return "bg-muted/50 text-muted-foreground border-border"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="max-w-2xl mx-auto px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-primary/10">
                <Image src="/xq-car-logo.png" alt="XQ Car" width={48} height={48} className="object-cover" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground leading-none">My Rental</h1>
                <p className="text-xs text-muted-foreground font-mono mt-1">{jobId}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onLogout} className="h-9 px-3">
              <LogOut className="h-4 w-4 mr-2" />
              <span className="text-sm">Logout</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-5 py-6 space-y-5 pb-24">
        <Card className="glass-card border-white/40 overflow-hidden p-0">
          <div className="relative h-64 bg-gradient-to-br from-muted/50 to-muted/20">
            <Image
              src={jobData.car.image || "/placeholder.svg"}
              alt={jobData.car.name}
              fill
              className="object-contain p-8"
              priority
            />
            <div className="absolute top-4 right-4">
              <Badge className="bg-green-500/90 text-white border-0 shadow-lg backdrop-blur-sm text-sm px-3 py-1">
                <CheckCircle className="h-4 w-4 mr-1.5" />
                Active
              </Badge>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground leading-tight">{jobData.car.name}</h2>
              <p className="text-base text-muted-foreground mt-1.5">{jobData.car.category}</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Badge variant="outline" className="text-sm font-medium px-3 py-1">
                {jobData.car.category}
              </Badge>
              <Badge variant="outline" className="text-sm font-medium px-3 py-1">
                {jobData.car.passengers} Seats
              </Badge>
              <Badge variant="outline" className="text-sm font-medium px-3 py-1">
                {jobData.car.fuelType}
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="glass-card border-white/40 p-5">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Add-ons Included</h3>
          <div className="grid grid-cols-2 gap-3">
            <div
              className={cn(
                "flex items-center gap-3 p-4 rounded-xl border transition-all",
                jobData.addOns.babySeat ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border/50 opacity-50",
              )}
            >
              <div
                className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0",
                  jobData.addOns.babySeat ? "bg-primary/10" : "bg-muted/50",
                )}
              >
                <Baby className={cn("h-5 w-5", jobData.addOns.babySeat ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground leading-tight">Baby Seat</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {jobData.addOns.babySeat ? "Included" : "Not included"}
                </div>
              </div>
              {jobData.addOns.babySeat && <Check className="h-5 w-5 text-primary flex-shrink-0" />}
            </div>
            <div
              className={cn(
                "flex items-center gap-3 p-4 rounded-xl border transition-all",
                jobData.addOns.secondDriver
                  ? "bg-primary/5 border-primary/20"
                  : "bg-muted/30 border-border/50 opacity-50",
              )}
            >
              <div
                className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0",
                  jobData.addOns.secondDriver ? "bg-primary/10" : "bg-muted/50",
                )}
              >
                <Users
                  className={cn("h-5 w-5", jobData.addOns.secondDriver ? "text-primary" : "text-muted-foreground")}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground leading-tight">2nd Driver</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {jobData.addOns.secondDriver ? "Included" : "Not included"}
                </div>
              </div>
              {jobData.addOns.secondDriver && <Check className="h-5 w-5 text-primary flex-shrink-0" />}
            </div>
          </div>
        </Card>

        <Card className="glass-card border-white/40 p-5">
          <div className="flex items-start gap-4 mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Pickup</h3>
                {pickupStatus === "completed" && (
                  <Badge className="bg-green-500/10 text-green-700 border-green-500/20 text-xs px-2 py-0.5">
                    <Check className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
              <div className="text-lg font-bold text-foreground leading-tight">
                {new Date(jobData.pickup.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                at {jobData.pickup.time}
              </div>
              <div className="flex items-center gap-2 text-base text-muted-foreground mt-2">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{jobData.pickup.location}</span>
              </div>
            </div>
          </div>
          {pickupStatus === "pending" ? (
            <Button
              onClick={handlePickupComplete}
              className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-base font-semibold"
            >
              <Check className="h-5 w-5 mr-2" />
              Mark as Picked Up
            </Button>
          ) : (
            showPickupUndo && (
              <Button
                onClick={handlePickupUndo}
                variant="outline"
                className="w-full h-12 border-amber-500/30 text-amber-700 hover:bg-amber-500/5 text-base font-semibold bg-transparent"
              >
                <Undo2 className="h-5 w-5 mr-2" />
                Undo Pickup Status
              </Button>
            )
          )}
        </Card>

        <Card className="glass-card border-white/40 p-5">
          <div className="flex items-start gap-4 mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Return</h3>
                {returnStatus === "completed" && (
                  <Badge className="bg-green-500/10 text-green-700 border-green-500/20 text-xs px-2 py-0.5">
                    <Check className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
              <div className="text-lg font-bold text-foreground leading-tight">
                {new Date(jobData.return.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                at {jobData.return.time}
              </div>
              <div className="flex items-center gap-2 text-base text-muted-foreground mt-2">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{jobData.return.location}</span>
              </div>
            </div>
          </div>
          {returnStatus === "pending" ? (
            <Button
              onClick={handleReturnComplete}
              className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-base font-semibold"
            >
              <Check className="h-5 w-5 mr-2" />
              Mark as Returned
            </Button>
          ) : (
            showReturnUndo && (
              <Button
                onClick={handleReturnUndo}
                variant="outline"
                className="w-full h-12 border-amber-500/30 text-amber-700 hover:bg-amber-500/5 text-base font-semibold bg-transparent"
              >
                <Undo2 className="h-5 w-5 mr-2" />
                Undo Return Status
              </Button>
            )
          )}
        </Card>

        <Card className="glass-card border-white/40 p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="h-11 w-11 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-foreground leading-tight mb-1">Need More Time?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Request to extend your rental period</p>
            </div>
          </div>
          <Button
            onClick={() => setIsExtendHourOpen(true)}
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 shadow-sm text-base font-semibold"
          >
            <Clock className="h-5 w-5 mr-2" />
            Request Extend Hour
          </Button>
        </Card>

        <Card className="glass-card border-white/40 p-5">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Rental Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-muted/30">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Total Days</div>
              <div className="text-3xl font-bold text-foreground">{jobData.rentDays}</div>
            </div>
            <div className="p-4 rounded-xl bg-muted/30">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Total Amount</div>
              <div className="text-3xl font-bold text-foreground">RM {jobData.totalAmount}</div>
            </div>
          </div>
        </Card>

        <Card className="glass-card border-white/40 p-5">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Contact Information</h3>
          <div className="space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                <Phone className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Phone</div>
                <div className="text-base font-semibold text-foreground truncate">{jobData.customer.phone}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Email</div>
                <div className="text-base font-semibold text-foreground truncate">{jobData.customer.email}</div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="glass-card border-white/40 p-5">
          <div className="flex items-start gap-3 mb-4">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">My Tickets</h3>
            <Badge variant="outline" className="ml-auto text-xs px-2 py-0.5">
              {jobTickets.length}
            </Badge>
          </div>
          <div className="space-y-3">
            {jobTickets.map((ticket) => (
              <div key={ticket.id} className="border border-border/50 rounded-xl overflow-hidden bg-background/50">
                <button
                  onClick={() => setExpandedTicketId(expandedTicketId === ticket.id ? null : ticket.id)}
                  className="w-full p-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-mono font-semibold text-foreground">{ticket.id}</span>
                        <Badge variant="outline" className={cn("text-xs px-2 py-0.5", getStatusColor(ticket.status))}>
                          {ticket.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs px-2 py-0.5">
                          {ticket.type}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn("text-xs px-2 py-0.5", getSeverityColor(ticket.severity))}
                        >
                          {ticket.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{ticket.description}</p>
                    </div>
                    {expandedTicketId === ticket.id ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                </button>

                {expandedTicketId === ticket.id && (
                  <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4">
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Description</div>
                      <p className="text-sm text-foreground leading-relaxed">{ticket.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Submitted</div>
                        <p className="text-sm text-foreground font-medium">
                          {new Date(ticket.submittedDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {ticket.assignedPIC && (
                        <div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">
                            Assigned To
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs font-semibold text-foreground">{ticket.assignedPIC}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {ticket.responses && ticket.responses.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2.5">Responses</div>
                        <div className="space-y-2.5">
                          {ticket.responses.map((response, index) => (
                            <div key={index} className="bg-muted/30 rounded-lg p-3.5">
                              <div className="flex items-center gap-2 mb-1.5">
                                <User className="h-3.5 w-3.5 text-primary" />
                                <span className="text-xs font-semibold text-foreground">{response.from}</span>
                                <span className="text-[10px] text-muted-foreground ml-auto">
                                  {new Date(response.timestamp).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <p className="text-sm text-foreground leading-relaxed">{response.message}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass-card border-white/40 p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="h-11 w-11 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <Gift className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-foreground leading-tight mb-1">Explore Benefits</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Rewards, must-try routes, essentials & safety tips
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsBenefitsOpen(true)}
            className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-600 shadow-sm text-base font-semibold"
          >
            <Gift className="h-5 w-5 mr-2" />
            View Benefits
          </Button>
        </Card>
      </div>

      <Dialog open={isCreateTicketOpen} onOpenChange={setIsCreateTicketOpen}>
        <DialogContent className="max-w-lg mx-4">
          <DialogHeader>
            <DialogTitle className="text-xl">Create Support Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2.5">
              <label className="text-sm font-semibold text-foreground">Issue Type</label>
              <Select value={ticketType} onValueChange={setTicketType}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Accident" className="text-base">
                    Accident
                  </SelectItem>
                  <SelectItem value="Extend Hour" className="text-base">
                    Extend Rental Time
                  </SelectItem>
                  <SelectItem value="Complaint" className="text-base">
                    Complaint
                  </SelectItem>
                  <SelectItem value="Other" className="text-base">
                    Other Issue
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2.5">
              <label className="text-sm font-semibold text-foreground">Description</label>
              <Textarea
                placeholder="Please describe your issue in detail..."
                value={ticketDescription}
                onChange={(e) => setTicketDescription(e.target.value)}
                className="min-h-[140px] resize-none text-base"
              />
            </div>

            <div className="space-y-2.5">
              <label className="text-sm font-semibold text-foreground">Attach Photos/Videos (Optional)</label>
              <div className="space-y-3">
                {uploadedFiles.length > 0 && (
                  <div className="grid grid-cols-3 gap-2.5">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
                        <Image
                          src={file || "/placeholder.svg"}
                          alt={`Upload ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <button
                          onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))}
                          className="absolute top-1.5 right-1.5 h-7 w-7 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="flex items-center justify-center gap-2.5 h-12 px-4 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-base font-medium text-muted-foreground">Upload Files</span>
                  <input type="file" multiple accept="image/*,video/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsCreateTicketOpen(false)} className="flex-1 h-12 text-base">
                Cancel
              </Button>
              <Button
                onClick={handleSubmitTicket}
                disabled={!ticketType || !ticketDescription}
                className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/90 text-base font-semibold"
              >
                Submit Ticket
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ClientExtendHourModal
        open={isExtendHourOpen}
        onOpenChange={setIsExtendHourOpen}
        orderedReturnDate={jobData.return.date}
        jobId={jobId}
      />

      <Dialog open={isBenefitsOpen} onOpenChange={setIsBenefitsOpen}>
        <DialogContent className="max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-600" />
              Your Benefits
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <a
              href="/client/benefits/rewards"
              className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Gift className="h-8 w-8 text-white" />
              </div>
              <div className="text-center">
                <div className="text-base font-bold text-foreground mb-1">Rewards</div>
                <div className="text-xs text-muted-foreground leading-relaxed">Points, tiers & referral bonuses</div>
              </div>
            </a>

            <a
              href="/client/benefits/must-try"
              className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Map className="h-8 w-8 text-white" />
              </div>
              <div className="text-center">
                <div className="text-base font-bold text-foreground mb-1">Must-Try</div>
                <div className="text-xs text-muted-foreground leading-relaxed">Routes, eat, see & do</div>
              </div>
            </a>

            <a
              href="/client/benefits/essentials"
              className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Fuel className="h-8 w-8 text-white" />
              </div>
              <div className="text-center">
                <div className="text-base font-bold text-foreground mb-1">Essentials</div>
                <div className="text-xs text-muted-foreground leading-relaxed">Fuel, tyre PSI & USB ports</div>
              </div>
            </a>

            <a
              href="/client/benefits/safety"
              className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div className="text-center">
                <div className="text-base font-bold text-foreground mb-1">Safety & Support</div>
                <div className="text-xs text-muted-foreground leading-relaxed">SOS & roadside assist</div>
              </div>
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
