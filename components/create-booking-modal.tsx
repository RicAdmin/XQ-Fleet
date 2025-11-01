"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Search, Check, Plus, AlertCircle } from "lucide-react"
import { format, isToday, differenceInHours, parse } from "date-fns"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { getAvailableCarsForBooking } from "@/lib/fleet-data"
import { useUser } from "@/lib/user-context"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"

type JobStatus = "Pending" | "Active" | "Cancelled" | "Completed" // Updated status types

interface StatusChangeLog {
  id: string
  changedBy: string
  fromStatus: JobStatus
  toStatus: JobStatus
  reason: string
  timestamp: string
}

interface CreateBookingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateBooking: (booking: {
    orderInvoiceId?: string
    carName: string
    carPlate: string
    customerName: string
    customerMobile: string
    startDate: string
    endDate: string
    status: JobStatus
    totalAmount: number
    pickupHour: string
    returnHour: string
    pickupLocation: string
    returnLocation: string
    customPickupLocation: string
    customReturnLocation: string
    bookingType: string
    depositAmount: number
    specialNote: string
    statusChangeLogs?: StatusChangeLog[]
    carOperator?: string // Added carOperator field
  }) => void
  editMode?: boolean
  jobId?: string
  initialData?: {
    orderInvoiceId?: string
    carName: string
    customerName: string
    customerMobile: string
    startDate: string
    endDate: string
    status: JobStatus
    totalAmount: number
    statusChangeLogs?: StatusChangeLog[]
  }
}

const availableCars = getAvailableCarsForBooking()

const customersDatabase = [
  { name: "John Smith", email: "john.smith@email.com", mobile: "+60123456789", icno: "850123-10-5678" },
  { name: "Sarah Johnson", email: "sarah.j@email.com", mobile: "+60198765432", icno: "920456-08-1234" },
  { name: "Michael Chen", email: "m.chen@email.com", mobile: "+60187654321", icno: "880789-14-9876" },
  { name: "Emily Davis", email: "emily.davis@email.com", mobile: "+60176543210", icno: "950321-06-5432" },
  { name: "David Wilson", email: "d.wilson@email.com", mobile: "+60165432109", icno: "870654-12-8765" },
  { name: "Lisa Anderson", email: "lisa.a@email.com", mobile: "+60154321098", icno: "910987-03-2109" },
]

const carOperatorsList = [
  { id: "OP-001", name: "John Smith" },
  { id: "OP-002", name: "Sarah Johnson" },
  { id: "OP-003", name: "Michael Chen" },
  { id: "OP-004", name: "David Wilson" },
]

const locations = ["Airport - Door 3", "Airport Parking", "Ferry Jetty Parking", "Other"]

const availableHours = [
  "7:00 AM",
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
  "8:00 PM",
  "9:00 PM",
  "10:00 PM",
]

export function CreateBookingModal({
  open,
  onOpenChange,
  onCreateBooking,
  editMode = false,
  jobId,
  initialData,
}: CreateBookingModalProps) {
  const [orderInvoiceId, setOrderInvoiceId] = useState<string>("")
  const [selectedCar, setSelectedCar] = useState<string>("")
  const [carPlate, setCarPlate] = useState<string>("")
  const [selectedCustomer, setSelectedCustomer] = useState<string>("")
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false)
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    mobile: "",
    icno: "",
  })
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [pickupHour, setPickupHour] = useState<string>("")
  const [returnHour, setReturnHour] = useState<string>("")
  const [pickupLocation, setPickupLocation] = useState<string>("")
  const [returnLocation, setReturnLocation] = useState<string>("")
  const [customPickupLocation, setCustomPickupLocation] = useState<string>("")
  const [customReturnLocation, setCustomReturnLocation] = useState<string>("")
  const [bookingType, setBookingType] = useState<string>("") // This will be renamed to salesChannel in UI
  const [status, setStatus] = useState<JobStatus>("Pending")
  const [rentalDays, setRentalDays] = useState<number>(0)
  const [rentalHours, setRentalHours] = useState<number>(0)
  const [babySeat, setBabySeat] = useState(false)
  const [secondDriver, setSecondDriver] = useState(false)
  const { currentUser } = useUser()
  const [initialStatus, setInitialStatus] = useState<JobStatus>("Pending")
  const [statusChangeReason, setStatusChangeReason] = useState<string>("")
  const [showReasonInput, setShowReasonInput] = useState(false)
  const [statusChangeLogs, setStatusChangeLogs] = useState<StatusChangeLog[]>([])
  const [dailyRate, setDailyRate] = useState<number>(0)
  const [hourlyRate, setHourlyRate] = useState<number>(0)
  const [totalAmount, setTotalAmount] = useState<number>(0)
  const [depositAmount, setDepositAmount] = useState<string>("")
  const [specialNote, setSpecialNote] = useState<string>("")
  const [carOperator, setCarOperator] = useState<string>("") // Added carOperator state

  useEffect(() => {
    const car = availableCars.find((c) => c.name === selectedCar)
    if (car) {
      setDailyRate(car.dailyRate)
      setHourlyRate(car.hourlyRate)
      setCarPlate(car.plate)
    }
  }, [selectedCar])

  useEffect(() => {
    if (startDate && endDate && pickupHour && returnHour && dailyRate > 0) {
      // Parse the time strings
      const pickupTime = parse(pickupHour, "h:mm a", startDate)
      const returnTime = parse(returnHour, "h:mm a", endDate)

      // Calculate total hours difference
      const totalHours = differenceInHours(returnTime, pickupTime)
      const days = Math.floor(totalHours / 24)
      const extraHours = totalHours % 24

      setRentalDays(days)
      setRentalHours(extraHours)

      // Calculate base rental amount
      let baseAmount = days * dailyRate + extraHours * hourlyRate

      // Add add-ons
      if (babySeat) baseAmount += 30
      if (secondDriver) baseAmount += 20

      setTotalAmount(baseAmount)
    } else {
      setRentalDays(0)
      setRentalHours(0)
      setTotalAmount(0)
    }
  }, [startDate, endDate, pickupHour, returnHour, dailyRate, hourlyRate, babySeat, secondDriver])

  useEffect(() => {
    if (editMode && initialData) {
      setOrderInvoiceId(initialData.orderInvoiceId || "")
      setSelectedCar(initialData.carName)
      setSelectedCustomer(initialData.customerName)
      setStartDate(new Date(initialData.startDate))
      setEndDate(new Date(initialData.endDate))
      setStatus(initialData.status)
      setInitialStatus(initialData.status)
      setStatusChangeLogs(initialData.statusChangeLogs || [])
    }
  }, [editMode, initialData])

  const handleStatusChange = (newStatus: JobStatus) => {
    if (editMode && newStatus !== initialStatus) {
      setShowReasonInput(true)
    } else {
      setShowReasonInput(false)
      setStatusChangeReason("")
    }
    setStatus(newStatus)
  }

  const handleSubmit = () => {
    // Removed bookingType check and added a general check for all required fields
    if (!selectedCar || !selectedCustomer || !startDate || !endDate || !pickupHour || !returnHour || !bookingType) {
      return
    }

    if (editMode && status !== initialStatus && !statusChangeReason.trim()) {
      alert("Please provide a reason for the status change")
      return
    }

    let updatedLogs = [...statusChangeLogs]
    if (editMode && status !== initialStatus && currentUser) {
      const newLog: StatusChangeLog = {
        id: `log-${Date.now()}`,
        changedBy: currentUser.name,
        fromStatus: initialStatus,
        toStatus: status,
        reason: statusChangeReason,
        timestamp: new Date().toISOString(),
      }
      updatedLogs = [newLog, ...updatedLogs]
    }

    onCreateBooking({
      orderInvoiceId: orderInvoiceId || undefined,
      carName: selectedCar,
      carPlate,
      customerName: selectedCustomer,
      customerMobile: selectedCustomerData?.mobile || "",
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
      status: status,
      totalAmount,
      pickupHour,
      returnHour,
      pickupLocation: pickupLocation === "Other" ? customPickupLocation : pickupLocation,
      returnLocation: returnLocation === "Other" ? customReturnLocation : returnLocation,
      customPickupLocation,
      customReturnLocation,
      bookingType,
      depositAmount: Number.parseFloat(depositAmount) || 0,
      specialNote,
      statusChangeLogs: updatedLogs,
      carOperator, // Added carOperator to submission
    })

    // Reset form
    setOrderInvoiceId("")
    setSelectedCar("")
    setCarPlate("")
    setSelectedCustomer("")
    setStartDate(undefined)
    setEndDate(undefined)
    setPickupHour("")
    setReturnHour("")
    setPickupLocation("")
    setReturnLocation("")
    setCustomPickupLocation("")
    setCustomReturnLocation("")
    setBookingType("")
    setStatus("Pending")
    setInitialStatus("Pending")
    setStatusChangeReason("")
    setShowReasonInput(false)
    setStatusChangeLogs([])
    setDailyRate(0)
    setHourlyRate(0)
    setTotalAmount(0)
    setDepositAmount("")
    setBabySeat(false)
    setSecondDriver(false)
    setRentalDays(0)
    setRentalHours(0)
    setSpecialNote("")
    setCarOperator("") // Reset carOperator
    onOpenChange(false)
  }

  const handleCreateCustomer = () => {
    if (!newCustomer.name || !newCustomer.email || !newCustomer.mobile || !newCustomer.icno) {
      return
    }

    customersDatabase.push({ ...newCustomer })
    setSelectedCustomer(newCustomer.name)
    setNewCustomer({ name: "", email: "", mobile: "", icno: "" })
    setIsCreateCustomerOpen(false)
    setCustomerSearchOpen(false)
  }

  const selectedCarData = availableCars.find((c) => c.name === selectedCar)
  const selectedCustomerData = customersDatabase.find((c) => c.name === selectedCustomer)

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
      case "Active": // Added Active status color
        return "bg-green-500/10 text-green-700 border-green-500/20"
      case "Completed":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20"
      case "Cancelled":
        return "bg-red-500/10 text-red-700 border-red-500/20"
      default:
        return ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto glass-modal border-white/50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            {editMode ? (
              <div className="flex items-center gap-2">
                <span>Edit Order Form</span>
                {jobId && <span className="text-lg font-mono text-muted-foreground">{jobId}</span>}
              </div>
            ) : (
              "Order Form"
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="orderInvoiceId" className="text-base font-medium">
              Order/Invoice ID
            </Label>
            <Input
              id="orderInvoiceId"
              value={orderInvoiceId}
              onChange={(e) => setOrderInvoiceId(e.target.value)}
              placeholder="Enter order or invoice ID (optional)"
              className="h-11"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="car" className="text-base font-medium">
              Select Vehicle
            </Label>
            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <Select value={selectedCar} onValueChange={setSelectedCar}>
                  <SelectTrigger id="car" className="h-11">
                    <SelectValue placeholder="Choose a vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCars.map((car) => (
                      <SelectItem key={car.name} value={car.name}>
                        <div className="flex items-center justify-between w-full">
                          <span>{car.name}</span>
                          <span className="ml-4 text-muted-foreground">RM{car.dailyRate}/day</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="space-y-1.5">
                  <Label htmlFor="carPlate" className="text-sm text-muted-foreground">
                    License Plate (Optional)
                  </Label>
                  <Input
                    id="carPlate"
                    value={carPlate}
                    onChange={(e) => setCarPlate(e.target.value)}
                    placeholder="Enter plate number"
                    className="h-10"
                  />
                </div>
              </div>
              {selectedCarData && (
                <div className="relative w-32 h-24 rounded-lg overflow-hidden border bg-muted">
                  <Image
                    src={selectedCarData.image || "/placeholder.svg"}
                    alt={selectedCarData.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium">Customer</Label>
            <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={customerSearchOpen}
                  className="w-full justify-between h-11 bg-transparent hover:bg-[#13116A]/5"
                >
                  {selectedCustomer ? (
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{selectedCustomer}</span>
                      {selectedCustomerData && (
                        <span className="text-xs text-muted-foreground">
                          {selectedCustomerData.email} • {selectedCustomerData.mobile}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Search customer by name, email, mobile, or IC...</span>
                  )}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[600px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search by name, email, mobile, or IC number..." />
                  <CommandList>
                    <CommandEmpty>
                      <div className="p-4 text-center">
                        <p className="text-sm text-muted-foreground mb-3">No customer found.</p>
                        <Button
                          onClick={() => {
                            setCustomerSearchOpen(false)
                            setIsCreateCustomerOpen(true)
                          }}
                          className="w-full"
                          variant="outline"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create New Customer
                        </Button>
                      </div>
                    </CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          setCustomerSearchOpen(false)
                          setIsCreateCustomerOpen(true)
                        }}
                        className="border-b"
                      >
                        <Plus className="mr-2 h-4 w-4 text-primary" />
                        <span className="font-medium text-primary">Create New Customer</span>
                      </CommandItem>
                      {customersDatabase.map((customer) => (
                        <CommandItem
                          key={customer.icno}
                          value={`${customer.name} ${customer.email} ${customer.mobile} ${customer.icno}`}
                          onSelect={() => {
                            setSelectedCustomer(customer.name)
                            setCustomerSearchOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCustomer === customer.name ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{customer.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {customer.email} • {customer.mobile} • {customer.icno}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bookingType" className="text-base font-medium">
              Sales Channel
            </Label>
            <Select value={bookingType} onValueChange={setBookingType}>
              <SelectTrigger id="bookingType" className="h-11">
                <SelectValue placeholder="Select sales channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Messaging">Messaging</SelectItem>
                <SelectItem value="Phone">Phone</SelectItem>
                <SelectItem value="Social">Social</SelectItem>
                <SelectItem value="Walk-in">Walk-in</SelectItem>
                <SelectItem value="Website">Website</SelectItem>
                <SelectItem value="WeChat">WeChat</SelectItem>
                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-base font-medium">
              Job Status
            </Label>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger id="status" className="h-11">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            {showReasonInput && (
              <div className="mt-3 p-4 rounded-lg border-2 border-[#FF8945]/30 bg-[#FF8945]/5 space-y-2">
                <div className="flex items-center gap-2 text-[#FF8945]">
                  <AlertCircle className="h-4 w-4" />
                  <Label htmlFor="statusReason" className="text-sm font-semibold">
                    Reason for Status Change (Required)
                  </Label>
                </div>
                <Textarea
                  id="statusReason"
                  value={statusChangeReason}
                  onChange={(e) => setStatusChangeReason(e.target.value)}
                  placeholder="Please explain why the status is being changed..."
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Changing from{" "}
                  <Badge variant="outline" className={cn("text-xs", getStatusColor(initialStatus))}>
                    {initialStatus}
                  </Badge>{" "}
                  to{" "}
                  <Badge variant="outline" className={cn("text-xs", getStatusColor(status))}>
                    {status}
                  </Badge>
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="carOperator" className="text-base font-medium">
              Car Operator
            </Label>
            <Select value={carOperator} onValueChange={setCarOperator}>
              <SelectTrigger id="carOperator" className="h-11">
                <SelectValue placeholder="Select car operator (optional)" />
              </SelectTrigger>
              <SelectContent>
                {carOperatorsList.map((operator) => (
                  <SelectItem key={operator.id} value={operator.name}>
                    {operator.name} ({operator.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {editMode && statusChangeLogs.length > 0 && (
            <div className="space-y-3 p-4 rounded-lg border border-white/40 glass-card">
              <h3 className="font-medium text-base">Status Change History</h3>
              <div className="space-y-3 max-h-[200px] overflow-y-auto">
                {statusChangeLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-md border bg-muted/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-xs", getStatusColor(log.fromStatus))}>
                          {log.fromStatus}
                        </Badge>
                        <span className="text-xs text-muted-foreground">→</span>
                        <Badge variant="outline" className={cn("text-xs", getStatusColor(log.toStatus))}>
                          {log.toStatus}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{log.reason}</p>
                    <p className="text-xs text-muted-foreground">Changed by: {log.changedBy}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3 p-4 rounded-lg border border-white/40 glass-card">
            <h3 className="font-medium text-base">Pickup Details</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm">Pickup Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-11 bg-background hover:bg-[#13116A]/5",
                        !startDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      modifiers={{
                        today: (date) => isToday(date),
                      }}
                      modifiersClassNames={{
                        today: "bg-[#FF8945] text-white font-bold ring-2 ring-[#FF8945] ring-offset-2",
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickupHour" className="text-sm">
                  Pickup Hour
                </Label>
                <Select value={pickupHour} onValueChange={setPickupHour}>
                  <SelectTrigger id="pickupHour" className="h-11 bg-background">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableHours.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickupLocation" className="text-sm">
                Pickup Location
              </Label>
              <Select value={pickupLocation} onValueChange={setPickupLocation}>
                <SelectTrigger id="pickupLocation" className="h-11 bg-background">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {pickupLocation === "Other" && (
                <Input
                  placeholder="Enter custom location"
                  value={customPickupLocation}
                  onChange={(e) => setCustomPickupLocation(e.target.value)}
                  className="mt-2 h-10"
                />
              )}
            </div>
          </div>

          <div className="space-y-3 p-4 rounded-lg border border-white/40 glass-card">
            <h3 className="font-medium text-base">Return Details</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm">Return Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-11 bg-background hover:bg-[#13116A]/5",
                        !endDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      modifiers={{
                        today: (date) => isToday(date),
                        pickupDate: startDate ? (date) => date.toDateString() === startDate.toDateString() : undefined,
                      }}
                      modifiersClassNames={{
                        today: "bg-[#FF8945] text-white font-bold ring-2 ring-[#FF8945] ring-offset-2",
                        pickupDate: "bg-blue-100 text-blue-900 font-semibold ring-2 ring-blue-400",
                      }}
                    />
                    {startDate && (
                      <div className="px-3 py-2 border-t bg-muted/50 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-sm bg-blue-100 ring-2 ring-blue-400"></span>
                          Pickup Date: {format(startDate, "PPP")}
                        </span>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="returnHour" className="text-sm">
                  Return Hour
                </Label>
                <Select value={returnHour} onValueChange={setReturnHour}>
                  <SelectTrigger id="returnHour" className="h-11 bg-background">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableHours.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="returnLocation" className="text-sm">
                Return Location
              </Label>
              <Select value={returnLocation} onValueChange={setReturnLocation}>
                <SelectTrigger id="returnLocation" className="h-11 bg-background">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {returnLocation === "Other" && (
                <Input
                  placeholder="Enter custom location"
                  value={customReturnLocation}
                  onChange={(e) => setCustomReturnLocation(e.target.value)}
                  className="mt-2 h-10"
                />
              )}
            </div>
          </div>

          {rentalDays > 0 || rentalHours > 0 ? (
            <div className="p-5 rounded-lg border-2 border-[#FF8945]/30 glass-card">
              <div className="space-y-4">
                <div className="pb-3 border-b border-[#FF8945]/20">
                  <h3 className="text-base font-semibold text-foreground mb-3">Amount Summary</h3>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Rental Duration:</span>
                      <span className="font-medium">
                        {rentalDays > 0 && `${rentalDays} ${rentalDays === 1 ? "day" : "days"}`}
                        {rentalDays > 0 && rentalHours > 0 && " + "}
                        {rentalHours > 0 && `${rentalHours} ${rentalHours === 1 ? "hour" : "hours"}`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Daily Rate:</span>
                      <span className="font-medium">
                        RM{dailyRate} × {rentalDays} {rentalDays === 1 ? "day" : "days"}
                      </span>
                    </div>

                    {rentalHours > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Extra Hours:</span>
                        <span className="font-medium">
                          RM{hourlyRate} × {rentalHours} {rentalHours === 1 ? "hour" : "hours"}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm pt-2 border-t border-[#FF8945]/10">
                      <span className="text-muted-foreground">Subtotal (Rent):</span>
                      <span className="font-semibold">RM{rentalDays * dailyRate + rentalHours * hourlyRate}</span>
                    </div>

                    {(babySeat || secondDriver) && (
                      <>
                        <div className="pt-2 border-t border-[#FF8945]/10">
                          <p className="text-sm font-medium text-muted-foreground mb-2">Add-Ons:</p>
                          {babySeat && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">• Car Baby Seat</span>
                              <span className="font-medium">RM30</span>
                            </div>
                          )}
                          {secondDriver && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">• Additional Second Driver</span>
                              <span className="font-medium">RM20</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm pt-2 border-t border-[#FF8945]/10">
                          <span className="text-muted-foreground">Subtotal (Add-Ons):</span>
                          <span className="font-semibold">RM{(babySeat ? 30 : 0) + (secondDriver ? 20 : 0)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                    <p className="text-3xl font-bold text-[#FF8945]">RM{totalAmount}</p>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex flex-col items-end gap-1 px-4 py-2 rounded-lg bg-white/50">
                      <p className="text-xs text-muted-foreground">Calculation</p>
                      <p className="text-sm font-medium">
                        {rentalDays > 0 && `${rentalDays}d × RM${dailyRate}`}
                        {rentalDays > 0 && rentalHours > 0 && " + "}
                        {rentalHours > 0 && `${rentalHours}h × RM${hourlyRate}`}
                        {(babySeat || secondDriver) && ` + RM${(babySeat ? 30 : 0) + (secondDriver ? 20 : 0)}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="space-y-3 p-4 rounded-lg border border-white/40 glass-card">
            <h3 className="font-medium text-base">Add-Ons</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 rounded-md border bg-background">
                <Checkbox
                  id="babySeat"
                  checked={babySeat}
                  onCheckedChange={(checked) => setBabySeat(checked as boolean)}
                  className="data-[state=checked]:bg-[#FF8945] data-[state=checked]:border-[#FF8945]"
                />
                <label
                  htmlFor="babySeat"
                  className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Car Baby Seat
                  <span className="block text-xs text-muted-foreground font-normal">RM30 / One Time</span>
                </label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-md border bg-background">
                <Checkbox
                  id="secondDriver"
                  checked={secondDriver}
                  onCheckedChange={(checked) => setSecondDriver(checked as boolean)}
                  className="data-[state=checked]:bg-[#FF8945] data-[state=checked]:border-[#FF8945]"
                />
                <label
                  htmlFor="secondDriver"
                  className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Additional Second Driver
                  <span className="block text-xs text-muted-foreground font-normal">RM20 / One Time</span>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-4 rounded-lg border border-white/40 glass-card">
            <h3 className="font-medium text-base">Payment Details</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dailyRate" className="text-sm">
                  Daily Rate
                </Label>
                <Input
                  id="dailyRate"
                  value={dailyRate > 0 ? `RM${dailyRate}` : ""}
                  disabled
                  className="bg-muted h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hourlyRate" className="text-sm">
                  Extra Fee/Hour
                </Label>
                <Input
                  id="hourlyRate"
                  value={hourlyRate > 0 ? `RM${hourlyRate}` : ""}
                  disabled
                  className="bg-muted h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="depositAmount" className="text-sm">
                Deposit Amount
              </Label>
              <Input
                id="depositAmount"
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Enter deposit amount"
                className="h-10"
              />
            </div>
          </div>

          <div className="space-y-3 p-4 rounded-lg border border-white/40 glass-card">
            <h3 className="font-medium text-base">Special Note</h3>
            <div className="space-y-2">
              <Label htmlFor="specialNote" className="text-sm">
                Additional Notes or Instructions
              </Label>
              <Textarea
                id="specialNote"
                value={specialNote}
                onChange={(e) => setSpecialNote(e.target.value)}
                placeholder="Enter any special requests, instructions, or notes for this booking..."
                rows={4}
                className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-11 hover:bg-[#13116A]/5">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !selectedCar || !selectedCustomer || !startDate || !endDate || !pickupHour || !returnHour || !bookingType
            }
            className="h-11 bg-[#2663EB] hover:bg-[#2663EB]/90"
          >
            {editMode ? "Update Order" : "Confirm Order"}
          </Button>
        </DialogFooter>
      </DialogContent>

      <Dialog open={isCreateCustomerOpen} onOpenChange={setIsCreateCustomerOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Create New Customer</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Full Name *</Label>
              <Input
                id="customerName"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                placeholder="Enter customer name"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email *</Label>
              <Input
                id="customerEmail"
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                placeholder="customer@email.com"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerMobile">Mobile Number *</Label>
              <Input
                id="customerMobile"
                value={newCustomer.mobile}
                onChange={(e) => setNewCustomer({ ...newCustomer, mobile: e.target.value })}
                placeholder="+60123456789"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerIC">IC Number *</Label>
              <Input
                id="customerIC"
                value={newCustomer.icno}
                onChange={(e) => setNewCustomer({ ...newCustomer, icno: e.target.value })}
                placeholder="850123-10-5678"
                className="h-10"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateCustomerOpen(false)
                setNewCustomer({ name: "", email: "", mobile: "", icno: "" })
              }}
              className="h-10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCustomer}
              disabled={!newCustomer.name || !newCustomer.email || !newCustomer.mobile || !newCustomer.icno}
              className="h-10 bg-[#2663EB] hover:bg-[#2663EB]/90"
            >
              Create Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
