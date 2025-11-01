"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Upload, X } from "lucide-react"
import { format, differenceInHours, parse } from "date-fns"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"

interface Job {
  id: string
  jobId: string
  carName: string
  customerName: string
  startDate: string
  endDate: string
  pickupHour: string
  returnHour: string
  totalAmount: number
  depositAmount: number
}

interface ProcessLog {
  id: string
  timestamp: string
  action: string
  operator: string
  details: string
}

interface JobProcessModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  job: Job | null
}

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

export function JobProcessModal({ open, onOpenChange, job }: JobProcessModalProps) {
  const [activeTab, setActiveTab] = useState<"pickup" | "return">("pickup")
  const [carAgreementId, setCarAgreementId] = useState("")

  // Pickup fields
  const [isDifferentPickupTime, setIsDifferentPickupTime] = useState(false)
  const [actualPickupDate, setActualPickupDate] = useState<Date>()
  const [actualPickupHour, setActualPickupHour] = useState("")
  const [pickupMileage, setPickupMileage] = useState("")
  const [pickupFuelLevel, setPickupFuelLevel] = useState("")
  const [pickupImages, setPickupImages] = useState<string[]>([])
  const [depositReceived, setDepositReceived] = useState("")
  const [diffTimeFee, setDiffTimeFee] = useState(0)
  const [diffTimeFeeReceived, setDiffTimeFeeReceived] = useState("")

  // Return fields
  const [returnMileage, setReturnMileage] = useState("")
  const [returnFuelLevel, setReturnFuelLevel] = useState("")
  const [returnImages, setReturnImages] = useState<string[]>([])

  // Process logs
  const [processLogs, setProcessLogs] = useState<ProcessLog[]>([
    {
      id: "1",
      timestamp: "2025-01-10 09:30 AM",
      action: "Pickup Completed",
      operator: "John Smith",
      details: "Vehicle picked up. Mileage: 45,230 km, Fuel: 95%",
    },
  ])

  // Calculate diff-time fee when actual pickup time differs
  useEffect(() => {
    if (!job || !isDifferentPickupTime || !actualPickupDate || !actualPickupHour) {
      setDiffTimeFee(0)
      return
    }

    const orderedPickupDate = new Date(job.startDate)
    const orderedPickupTime = parse(job.pickupHour, "h:mm a", orderedPickupDate)
    const actualPickupTime = parse(actualPickupHour, "h:mm a", actualPickupDate)

    const hoursDiff = Math.abs(differenceInHours(actualPickupTime, orderedPickupTime))

    // Assuming hourly rate of RM50 for diff-time fee
    const hourlyRate = 50
    const calculatedFee = hoursDiff * hourlyRate

    setDiffTimeFee(calculatedFee)
  }, [job, isDifferentPickupTime, actualPickupDate, actualPickupHour])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "pickup" | "return") => {
    const files = e.target.files
    if (!files) return

    const newImages: string[] = []
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        newImages.push(reader.result as string)
        if (newImages.length === files.length) {
          if (type === "pickup") {
            setPickupImages([...pickupImages, ...newImages])
          } else {
            setReturnImages([...returnImages, ...newImages])
          }
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number, type: "pickup" | "return") => {
    if (type === "pickup") {
      setPickupImages(pickupImages.filter((_, i) => i !== index))
    } else {
      setReturnImages(returnImages.filter((_, i) => i !== index))
    }
  }

  const handleSubmitPickup = () => {
    // Handle pickup submission
    const newLog: ProcessLog = {
      id: String(processLogs.length + 1),
      timestamp: new Date().toLocaleString(),
      action: "Pickup Completed",
      operator: "Current User",
      details: `Mileage: ${pickupMileage} km, Fuel: ${pickupFuelLevel}%, Deposit: RM${depositReceived}${diffTimeFee > 0 ? `, Diff-Time Fee: RM${diffTimeFeeReceived}` : ""}`,
    }
    setProcessLogs([newLog, ...processLogs])

    // Reset pickup form
    setIsDifferentPickupTime(false)
    setActualPickupDate(undefined)
    setActualPickupHour("")
    setPickupMileage("")
    setPickupFuelLevel("")
    setPickupImages([])
    setDepositReceived("")
    setDiffTimeFeeReceived("")
  }

  const handleSubmitReturn = () => {
    // Handle return submission
    const newLog: ProcessLog = {
      id: String(processLogs.length + 1),
      timestamp: new Date().toLocaleString(),
      action: "Return Completed",
      operator: "Current User",
      details: `Mileage: ${returnMileage} km, Fuel: ${returnFuelLevel}%`,
    }
    setProcessLogs([newLog, ...processLogs])

    // Reset return form
    setReturnMileage("")
    setReturnFuelLevel("")
    setReturnImages([])
  }

  if (!job) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Job Process - {job.jobId}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {job.carName} • {job.customerName}
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Car Agreement ID */}
          <div className="space-y-2">
            <Label htmlFor="carAgreementId" className="text-base font-medium">
              Car Agreement ID
            </Label>
            <Input
              id="carAgreementId"
              value={carAgreementId}
              onChange={(e) => setCarAgreementId(e.target.value)}
              placeholder="Enter car agreement ID"
              className="h-11"
            />
          </div>

          {/* Tabs for Pickup and Return */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "pickup" | "return")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pickup">Pickup Process</TabsTrigger>
              <TabsTrigger value="return">Return Process</TabsTrigger>
            </TabsList>

            {/* Pickup Tab */}
            <TabsContent value="pickup" className="space-y-4 mt-4">
              <Card className="p-4 bg-muted/30">
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Ordered Pickup Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Date:</span>
                      <span className="ml-2 font-medium">{format(new Date(job.startDate), "PPP")}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Time:</span>
                      <span className="ml-2 font-medium">{job.pickupHour}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Different Pickup Time Checkbox */}
              <div className="flex items-center space-x-3 p-4 rounded-lg border bg-background">
                <Checkbox
                  id="differentPickupTime"
                  checked={isDifferentPickupTime}
                  onCheckedChange={(checked) => setIsDifferentPickupTime(checked as boolean)}
                  className="data-[state=checked]:bg-[#FF8945] data-[state=checked]:border-[#FF8945]"
                />
                <label htmlFor="differentPickupTime" className="text-sm font-medium leading-none cursor-pointer">
                  Actual Pickup Date/Time is different from Ordered Date/Time
                </label>
              </div>

              {/* Actual Pickup Date/Time Section */}
              {isDifferentPickupTime && (
                <Card className="p-4 border-[#FF8945]/30 bg-[#FF8945]/5">
                  <h3 className="font-semibold text-sm mb-4">Actual Pickup Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Actual Pickup Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-11",
                              !actualPickupDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {actualPickupDate ? format(actualPickupDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={actualPickupDate}
                            onSelect={setActualPickupDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="actualPickupHour" className="text-sm">
                        Actual Pickup Time
                      </Label>
                      <select
                        id="actualPickupHour"
                        value={actualPickupHour}
                        onChange={(e) => setActualPickupHour(e.target.value)}
                        className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">Select time</option>
                        {availableHours.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {diffTimeFee > 0 && (
                    <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                      <p className="text-sm font-semibold text-yellow-700">Diff-Time Fee: RM{diffTimeFee}</p>
                      <p className="text-xs text-muted-foreground mt-1">Additional charges due to time difference</p>
                    </div>
                  )}
                </Card>
              )}

              {/* Payment Section */}
              <Card className="p-4 bg-background">
                <h3 className="font-semibold text-sm mb-4">Payment Collection</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="depositReceived" className="text-sm">
                      Deposit Amount Received (RM)
                    </Label>
                    <Input
                      id="depositReceived"
                      type="number"
                      value={depositReceived}
                      onChange={(e) => setDepositReceived(e.target.value)}
                      placeholder="0.00"
                      className="h-10"
                    />
                  </div>

                  {diffTimeFee > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="diffTimeFeeReceived" className="text-sm">
                        Diff-Time Fee Received (RM)
                      </Label>
                      <Input
                        id="diffTimeFeeReceived"
                        type="number"
                        value={diffTimeFeeReceived}
                        onChange={(e) => setDiffTimeFeeReceived(e.target.value)}
                        placeholder={String(diffTimeFee)}
                        className="h-10"
                      />
                    </div>
                  )}
                </div>
              </Card>

              {/* Vehicle Condition */}
              <Card className="p-4 bg-background">
                <h3 className="font-semibold text-sm mb-4">Vehicle Condition (Before Release)</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="pickupMileage" className="text-sm">
                      Mileage (km)
                    </Label>
                    <Input
                      id="pickupMileage"
                      type="number"
                      value={pickupMileage}
                      onChange={(e) => setPickupMileage(e.target.value)}
                      placeholder="Enter mileage"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pickupFuelLevel" className="text-sm">
                      Fuel Level (%)
                    </Label>
                    <Input
                      id="pickupFuelLevel"
                      type="number"
                      value={pickupFuelLevel}
                      onChange={(e) => setPickupFuelLevel(e.target.value)}
                      placeholder="0-100"
                      min="0"
                      max="100"
                      className="h-10"
                    />
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label className="text-sm">Upload Vehicle Photos</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("pickup-image-upload")?.click()}
                      className="h-10"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Images
                    </Button>
                    <input
                      id="pickup-image-upload"
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, "pickup")}
                    />
                  </div>

                  {pickupImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {pickupImages.map((img, index) => (
                        <div key={index} className="relative group">
                          <Image
                            src={img || "/placeholder.svg"}
                            alt={`Pickup ${index + 1}`}
                            width={100}
                            height={100}
                            className="rounded-lg object-cover w-full h-24"
                          />
                          <button
                            onClick={() => removeImage(index, "pickup")}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              <Button
                onClick={handleSubmitPickup}
                className="w-full h-11 bg-[#2663EB] hover:bg-[#2663EB]/90"
                disabled={!pickupMileage || !pickupFuelLevel || !depositReceived}
              >
                Complete Pickup Process
              </Button>
            </TabsContent>

            {/* Return Tab */}
            <TabsContent value="return" className="space-y-4 mt-4">
              <Card className="p-4 bg-muted/30">
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Ordered Return Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Date:</span>
                      <span className="ml-2 font-medium">{format(new Date(job.endDate), "PPP")}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Time:</span>
                      <span className="ml-2 font-medium">{job.returnHour}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Vehicle Condition on Return */}
              <Card className="p-4 bg-background">
                <h3 className="font-semibold text-sm mb-4">Vehicle Condition (Upon Return)</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="returnMileage" className="text-sm">
                      Mileage (km)
                    </Label>
                    <Input
                      id="returnMileage"
                      type="number"
                      value={returnMileage}
                      onChange={(e) => setReturnMileage(e.target.value)}
                      placeholder="Enter mileage"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="returnFuelLevel" className="text-sm">
                      Fuel Level (%)
                    </Label>
                    <Input
                      id="returnFuelLevel"
                      type="number"
                      value={returnFuelLevel}
                      onChange={(e) => setReturnFuelLevel(e.target.value)}
                      placeholder="0-100"
                      min="0"
                      max="100"
                      className="h-10"
                    />
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label className="text-sm">Upload Vehicle Photos</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("return-image-upload")?.click()}
                      className="h-10"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Images
                    </Button>
                    <input
                      id="return-image-upload"
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, "return")}
                    />
                  </div>

                  {returnImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {returnImages.map((img, index) => (
                        <div key={index} className="relative group">
                          <Image
                            src={img || "/placeholder.svg"}
                            alt={`Return ${index + 1}`}
                            width={100}
                            height={100}
                            className="rounded-lg object-cover w-full h-24"
                          />
                          <button
                            onClick={() => removeImage(index, "return")}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              <Button
                onClick={handleSubmitReturn}
                className="w-full h-11 bg-[#2663EB] hover:bg-[#2663EB]/90"
                disabled={!returnMileage || !returnFuelLevel}
              >
                Complete Return Process
              </Button>
            </TabsContent>
          </Tabs>

          {/* Process History Log */}
          <Card className="p-4 bg-muted/20">
            <h3 className="font-semibold text-base mb-4">Job Process History</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {processLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-lg border bg-background space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-medium">
                      {log.action}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                  </div>
                  <p className="text-sm text-foreground">{log.details}</p>
                  <p className="text-xs text-muted-foreground">Operator: {log.operator}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-11">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
