"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Droplet, Wrench, Calendar, Clock, AlertCircle } from "lucide-react"
import { fleetCars } from "@/lib/fleet-data"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

interface ScheduleServiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScheduleService: (service: {
    carName: string
    carImage: string
    type: "Maintenance" | "Wash"
    scheduledDate: string
    scheduledTime: string
    vendor: string
    notes?: string
  }) => void
}

// Mock upcoming jobs data - in real app, this would come from API
const mockUpcomingJobs = [
  {
    carName: "TOYOTA VIOS 3G (FACELIFT)",
    customerName: "John Smith",
    startDate: "2025-01-15",
    endDate: "2025-01-18",
    startTime: "09:00",
    endTime: "17:00",
  },
  {
    carName: "TOYOTA VIOS 3G (FACELIFT)",
    customerName: "Sarah Johnson",
    startDate: "2025-01-20",
    endDate: "2025-01-22",
    startTime: "10:00",
    endTime: "16:00",
  },
  {
    carName: "PERODUA AXIA",
    customerName: "Michael Chen",
    startDate: "2025-01-12",
    endDate: "2025-01-14",
    startTime: "08:00",
    endTime: "18:00",
  },
]

export function ScheduleServiceModal({ open, onOpenChange, onScheduleService }: ScheduleServiceModalProps) {
  const [serviceType, setServiceType] = useState<"Maintenance" | "Wash">("Wash")
  const [selectedCar, setSelectedCar] = useState("")
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  const [vendor, setVendor] = useState("")
  const [notes, setNotes] = useState("")

  // Get upcoming jobs for selected car
  const upcomingJobs = mockUpcomingJobs.filter((job) => job.carName === selectedCar)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const car = fleetCars.find((c) => c.name === selectedCar)
    if (!car) return

    onScheduleService({
      carName: selectedCar,
      carImage: car.image,
      type: serviceType,
      scheduledDate,
      scheduledTime,
      vendor,
      notes: notes || undefined,
    })

    // Reset form
    setServiceType("Wash")
    setSelectedCar("")
    setScheduledDate("")
    setScheduledTime("")
    setVendor("")
    setNotes("")
    onOpenChange(false)
  }

  const isFormValid = selectedCar && scheduledDate && scheduledTime && vendor

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-950 rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/10 to-teal-500/10">
              {serviceType === "Wash" ? (
                <Droplet className="h-5 w-5 text-teal-600" />
              ) : (
                <Wrench className="h-5 w-5 text-blue-600" />
              )}
            </div>
            <div>
              <DialogTitle className="text-xl">Schedule Vehicle Service</DialogTitle>
              <DialogDescription>Schedule maintenance or wash service for your fleet</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-3">
            <Label>Service Type</Label>
            <RadioGroup value={serviceType} onValueChange={(v) => setServiceType(v as "Maintenance" | "Wash")}>
              <div className="grid grid-cols-2 gap-3">
                <label
                  htmlFor="wash"
                  className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    serviceType === "Wash" ? "border-teal-500 bg-teal-500/5" : "border-border hover:border-teal-500/50"
                  }`}
                >
                  <RadioGroupItem value="Wash" id="wash" />
                  <div className="flex items-center gap-2">
                    <Droplet className="h-5 w-5 text-teal-600" />
                    <span className="font-medium">Request for Wash</span>
                  </div>
                </label>

                <label
                  htmlFor="maintenance"
                  className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    serviceType === "Maintenance"
                      ? "border-blue-500 bg-blue-500/5"
                      : "border-border hover:border-blue-500/50"
                  }`}
                >
                  <RadioGroupItem value="Maintenance" id="maintenance" />
                  <div className="flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Send for Maintenance</span>
                  </div>
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Select Car */}
          <div className="space-y-2">
            <Label htmlFor="car">Select Vehicle</Label>
            <Select value={selectedCar} onValueChange={setSelectedCar}>
              <SelectTrigger id="car">
                <SelectValue placeholder="Choose a vehicle" />
              </SelectTrigger>
              <SelectContent>
                {fleetCars.map((car) => (
                  <SelectItem key={car.name} value={car.name}>
                    {car.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCar && upcomingJobs.length > 0 && (
            <Card className="p-4 bg-blue-500/5 border-blue-500/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <p className="text-sm font-semibold text-foreground">Upcoming Jobs for this Vehicle</p>
                  <div className="space-y-2">
                    {upcomingJobs.map((job, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-xs bg-background/50 p-2 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{job.customerName}</p>
                          <p className="text-muted-foreground">
                            {new Date(job.startDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            -{" "}
                            {new Date(job.endDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {job.startTime} - {job.endTime}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Schedule service at a time that doesn't conflict with these bookings
                  </p>
                </div>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">
                <Calendar className="h-4 w-4 inline mr-1" />
                Schedule Date
              </Label>
              <Input
                id="scheduledDate"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledTime">
                <Clock className="h-4 w-4 inline mr-1" />
                Schedule Time
              </Label>
              <Input
                id="scheduledTime"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor">Service Vendor</Label>
            <Input
              id="vendor"
              type="text"
              placeholder="Enter vendor name..."
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any special instructions or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid}
              className={`flex-1 ${
                serviceType === "Wash" ? "bg-teal-600 hover:bg-teal-700" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {serviceType === "Wash" ? (
                <>
                  <Droplet className="h-4 w-4 mr-2" />
                  Schedule Wash
                </>
              ) : (
                <>
                  <Wrench className="h-4 w-4 mr-2" />
                  Schedule Maintenance
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
