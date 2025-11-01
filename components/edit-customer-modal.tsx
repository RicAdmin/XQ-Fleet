"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  totalBookings: number
  lastJobId: string | null
  lastJobDate: string | null
  status: "Active" | "Inactive"
  createdDate: string
  ticketsCreated: number
}

interface EditCustomerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: Customer | null
  onSave: (customer: Customer) => void
}

export function EditCustomerModal({ open, onOpenChange, customer, onSave }: EditCustomerModalProps) {
  const [formData, setFormData] = useState<Customer | null>(customer)

  useEffect(() => {
    if (customer) {
      setFormData(customer)
    }
  }, [customer])

  if (!formData) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Edit Customer</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Status */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Customer Status</Label>
              <p className="text-sm text-muted-foreground">
                {formData.status === "Active" ? "Customer is active" : "Customer is inactive"}
              </p>
            </div>
            <Switch
              checked={formData.status === "Active"}
              onCheckedChange={(checked) => setFormData({ ...formData, status: checked ? "Active" : "Inactive" })}
            />
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Basic Information</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Customer Statistics (Read-only) */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Customer Statistics</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Total Jobs</p>
                <p className="text-2xl font-bold">{formData.totalBookings}</p>
              </div>

              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Tickets Created</p>
                <p className="text-2xl font-bold">{formData.ticketsCreated}</p>
              </div>

              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Customer Since</p>
                <p className="text-sm font-medium">
                  {new Date(formData.createdDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Last Job</p>
                <p className="text-sm font-medium">
                  {formData.lastJobId || "No jobs yet"}
                  {formData.lastJobDate && (
                    <span className="block text-xs text-muted-foreground mt-0.5">
                      {new Date(formData.lastJobDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
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
