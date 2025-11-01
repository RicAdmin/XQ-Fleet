"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface Location {
  name: string
  address: string
  totalCars: number
  availableCars: number
  maintenanceCars: number
  washCars: number
  manager: string
  contact: string
}

interface AddLocationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddLocation: (location: Location) => void
}

export function AddLocationModal({ open, onOpenChange, onAddLocation }: AddLocationModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    manager: "",
    contact: "",
  })
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.address || !formData.manager || !formData.contact) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    const newLocation: Location = {
      ...formData,
      totalCars: 0,
      availableCars: 0,
      maintenanceCars: 0,
      washCars: 0,
    }

    onAddLocation(newLocation)

    toast({
      title: "Success",
      description: `Location "${formData.name}" has been added successfully`,
    })

    setFormData({
      name: "",
      address: "",
      manager: "",
      contact: "",
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Location</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Location Name</Label>
            <Input
              id="name"
              placeholder="e.g., Airport CP"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              placeholder="Full address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manager">Manager Name</Label>
            <Input
              id="manager"
              placeholder="Manager's full name"
              value={formData.manager}
              onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">Contact Number</Label>
            <Input
              id="contact"
              placeholder="+60 12-345 6789"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Location
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
