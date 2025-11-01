"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AlertCircle } from "lucide-react"

interface User {
  id: string
  name: string
  role: "Super Admin" | "Operation" | "Customer Care"
  email: string
  mobile: string
  status: "Active" | "Inactive"
  createdOn: string
}

interface EditUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
  onEditUser: (user: User) => void
}

export function EditUserModal({ open, onOpenChange, user, onEditUser }: EditUserModalProps) {
  const [formData, setFormData] = useState<User>(user)
  const [roleChanged, setRoleChanged] = useState(false)
  const [originalRole, setOriginalRole] = useState(user.role)

  useEffect(() => {
    setFormData(user)
    setOriginalRole(user.role)
    setRoleChanged(false)
  }, [user])

  const handleRoleChange = (newRole: string) => {
    setFormData({ ...formData, role: newRole as any })
    setRoleChanged(newRole !== originalRole)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (roleChanged) {
      const confirmed = window.confirm(
        `Are you sure you want to transfer ${formData.name} from ${originalRole} to ${formData.role}? This will change their access permissions.`,
      )
      if (!confirmed) return
    }

    onEditUser(formData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update user information and permissions</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Super Admin">Super Admin</SelectItem>
                  <SelectItem value="Operation">Operation</SelectItem>
                  <SelectItem value="Customer Care">Customer Care</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {roleChanged && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-800">
                <p className="font-semibold">Role Transfer</p>
                <p>
                  Changing from{" "}
                  <Badge variant="outline" className="mx-1">
                    {originalRole}
                  </Badge>{" "}
                  to{" "}
                  <Badge variant="outline" className="mx-1">
                    {formData.role}
                  </Badge>{" "}
                  will update access permissions.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-mobile">Mobile No</Label>
            <Input
              id="edit-mobile"
              type="tel"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              placeholder="+60 12-345 6789"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "Active" | "Inactive") => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger id="edit-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
