"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type ServiceType = "Maintenance" | "Wash"
type ServiceStatus = "Scheduled" | "Progressing" | "Completed" | "Missed" | "Urgent"

interface ServiceRecord {
  id: string
  carName: string
  carImage: string
  type: ServiceType
  requestedDate: string
  requestedTime: string
  scheduledDate: string
  completedDate: string | null
  vendor: string
  status: ServiceStatus
  notes?: string
}

interface EditServiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service: ServiceRecord | null
  onUpdateService: (service: ServiceRecord) => void
}

export function EditServiceModal({ open, onOpenChange, service, onUpdateService }: EditServiceModalProps) {
  const [formData, setFormData] = useState<ServiceRecord | null>(null)

  useEffect(() => {
    if (service) {
      setFormData(service)
    }
  }, [service])

  if (!formData) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdateService(formData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Edit Service Record</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vehicle Info (Read-only) */}
          <div className="space-y-2">
            <Label>Vehicle</Label>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="relative w-16 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                <img
                  src={formData.carImage || "/placeholder.svg"}
                  alt={formData.carName}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-medium text-sm">{formData.carName}</span>
            </div>
          </div>

          {/* Service Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Service Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as ServiceType })}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Wash">Wash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Request Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="requestedDate">Request Date</Label>
              <Input
                id="requestedDate"
                type="date"
                value={formData.requestedDate}
                onChange={(e) => setFormData({ ...formData, requestedDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requestedTime">Request Time</Label>
              <Input
                id="requestedTime"
                type="time"
                value={formData.requestedTime}
                onChange={(e) => setFormData({ ...formData, requestedTime: e.target.value })}
              />
            </div>
          </div>

          {/* Scheduled Date */}
          <div className="space-y-2">
            <Label htmlFor="scheduledDate">Scheduled Date</Label>
            <Input
              id="scheduledDate"
              type="date"
              value={formData.scheduledDate}
              onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
            />
          </div>

          {/* Completed Date */}
          <div className="space-y-2">
            <Label htmlFor="completedDate">Completed Date</Label>
            <Input
              id="completedDate"
              type="date"
              value={formData.completedDate || ""}
              onChange={(e) => setFormData({ ...formData, completedDate: e.target.value || null })}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as ServiceStatus })}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="Progressing">Progressing</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Urgent">Urgent</SelectItem>
                <SelectItem value="Missed">Missed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Vendor */}
          <div className="space-y-2">
            <Label htmlFor="vendor">Service Vendor</Label>
            <Input
              id="vendor"
              value={formData.vendor}
              onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
              placeholder="Enter vendor name"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#2663EB] hover:bg-[#2663EB]/90">
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
