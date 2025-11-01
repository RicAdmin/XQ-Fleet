"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

interface Location {
  id: string
  name: string
  address: string
  totalCars: number
  availableCars: number
  maintenanceCars: number
  washCars: number
  manager: string
  contact: string
}

interface TransferCarsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  locations: Location[]
}

export function TransferCarsModal({ open, onOpenChange, locations }: TransferCarsModalProps) {
  const [fromLocation, setFromLocation] = useState<string>("")
  const [toLocation, setToLocation] = useState<string>("")
  const [numberOfCars, setNumberOfCars] = useState<string>("1")
  const { toast } = useToast()

  const handleTransfer = () => {
    if (!fromLocation || !toLocation) {
      toast({
        title: "Error",
        description: "Please select both source and destination locations",
        variant: "destructive",
      })
      return
    }

    if (fromLocation === toLocation) {
      toast({
        title: "Error",
        description: "Source and destination locations must be different",
        variant: "destructive",
      })
      return
    }

    const from = locations.find((l) => l.id === fromLocation)
    const to = locations.find((l) => l.id === toLocation)

    toast({
      title: "Transfer Initiated",
      description: `${numberOfCars} car(s) will be transferred from ${from?.name} to ${to?.name}`,
    })

    setFromLocation("")
    setToLocation("")
    setNumberOfCars("1")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Cars Between Locations</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="from">From Location</Label>
            <Select value={fromLocation} onValueChange={setFromLocation}>
              <SelectTrigger id="from">
                <SelectValue placeholder="Select source location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name} ({location.availableCars} available)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="to">To Location</Label>
            <Select value={toLocation} onValueChange={setToLocation}>
              <SelectTrigger id="to">
                <SelectValue placeholder="Select destination location" />
              </SelectTrigger>
              <SelectContent>
                {locations
                  .filter((loc) => loc.id !== fromLocation)
                  .map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="count">Number of Cars</Label>
            <Input
              id="count"
              type="number"
              min="1"
              value={numberOfCars}
              onChange={(e) => setNumberOfCars(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleTransfer} className="flex-1">
              Confirm Transfer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
