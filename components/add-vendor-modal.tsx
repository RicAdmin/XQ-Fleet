"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AddVendorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddVendor: (vendor: { name: string; type: "Car Wash" | "Maintenance"; contact: string; rating: number }) => void
}

export function AddVendorModal({ open, onOpenChange, onAddVendor }: AddVendorModalProps) {
  const [name, setName] = useState("")
  const [type, setType] = useState<"Car Wash" | "Maintenance">("Car Wash")
  const [contact, setContact] = useState("")
  const [rating, setRating] = useState("4.0")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !contact) {
      alert("Please fill in all required fields")
      return
    }

    onAddVendor({ name, type, contact, rating: Number.parseFloat(rating) })

    // Reset form
    setName("")
    setType("Car Wash")
    setContact("")
    setRating("4.0")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
          <DialogDescription>Add a new vendor for car wash or maintenance services</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="vendor-name">
              Vendor Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="vendor-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter vendor name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor-type">
              Type <span className="text-destructive">*</span>
            </Label>
            <Select value={type} onValueChange={(value) => setType(value as "Car Wash" | "Maintenance")} required>
              <SelectTrigger id="vendor-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Car Wash">Car Wash</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">
              Contact <span className="text-destructive">*</span>
            </Label>
            <Input
              id="contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="+60 12-345-6789"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rating">Rating (0-5)</Label>
            <Input
              id="rating"
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              placeholder="4.0"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Vendor
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
