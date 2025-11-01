"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Droplet } from "lucide-react"

interface ScheduleWashModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScheduleWash: (wash: {
    carName: string
    carImage: string
    scheduledDate: string
    vendor: string
    cost: number
    notes?: string
  }) => void
}

const availableCars = [
  { name: "Toyota Camry - ABC-1234", image: "/toyota-camry-sedan.png" },
  { name: "Honda Odyssey - XYZ-5678", image: "/honda-odyssey-mpv.jpg" },
  { name: "Ford Explorer - DEF-9012", image: "/ford-explorer-suv.jpg" },
  { name: "Nissan Altima - GHI-3456", image: "/nissan-altima-sedan.jpg" },
  { name: "Chevrolet Tahoe - JKL-7890", image: "/chevrolet-tahoe-suv.jpg" },
]

const vendors = ["Sparkle Auto Wash", "Clean & Shine", "Quick Wash Pro", "Premium Detailing", "Express Car Wash"]

export function ScheduleWashModal({ open, onOpenChange, onScheduleWash }: ScheduleWashModalProps) {
  const [selectedCar, setSelectedCar] = useState("")
  const [scheduledDate, setScheduledDate] = useState("")
  const [vendor, setVendor] = useState("")
  const [cost, setCost] = useState("")
  const [notes, setNotes] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const car = availableCars.find((c) => c.name === selectedCar)
    if (!car) return

    onScheduleWash({
      carName: selectedCar,
      carImage: car.image,
      scheduledDate,
      vendor,
      cost: Number.parseFloat(cost),
      notes: notes || undefined,
    })

    // Reset form
    setSelectedCar("")
    setScheduledDate("")
    setVendor("")
    setCost("")
    setNotes("")
    onOpenChange(false)
  }

  const isFormValid = selectedCar && scheduledDate && vendor && cost

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-500/10">
              <Droplet className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">Schedule Car Wash</DialogTitle>
              <DialogDescription>Add a new car wash appointment to the schedule</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Select Car */}
          <div className="space-y-2">
            <Label htmlFor="car">Select Car</Label>
            <Select value={selectedCar} onValueChange={setSelectedCar}>
              <SelectTrigger id="car">
                <SelectValue placeholder="Choose a car" />
              </SelectTrigger>
              <SelectContent>
                {availableCars.map((car) => (
                  <SelectItem key={car.name} value={car.name}>
                    {car.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scheduled Date */}
          <div className="space-y-2">
            <Label htmlFor="scheduledDate">Scheduled Date</Label>
            <Input
              id="scheduledDate"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Vendor */}
          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor</Label>
            <Select value={vendor} onValueChange={setVendor}>
              <SelectTrigger id="vendor">
                <SelectValue placeholder="Choose a vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estimated Cost */}
          <div className="space-y-2">
            <Label htmlFor="cost">Estimated Cost ($)</Label>
            <Input
              id="cost"
              type="number"
              placeholder="25.00"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              min="0"
              step="0.01"
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
            <Button type="submit" disabled={!isFormValid} className="flex-1 bg-teal-600 hover:bg-teal-700">
              Schedule Wash
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
