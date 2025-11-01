"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AddUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddUser: (user: {
    name: string
    role: string
    email: string
    mobile: string
    status: "Active" | "Inactive"
  }) => void
}

export function AddUserModal({ open, onOpenChange, onAddUser }: AddUserModalProps) {
  const [name, setName] = useState("")
  const [role, setRole] = useState("")
  const [email, setEmail] = useState("")
  const [mobile, setMobile] = useState("")
  const [status, setStatus] = useState<"Active" | "Inactive">("Active")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !role || !email || !mobile) {
      alert("Please fill in all required fields")
      return
    }

    onAddUser({ name, role, email, mobile, status })

    // Reset form
    setName("")
    setRole("")
    setEmail("")
    setMobile("")
    setStatus("Active")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>Add a new user to the system with their role and contact information</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter user name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">
                Role <span className="text-destructive">*</span>
              </Label>
              <Select value={role} onValueChange={setRole} required>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Super Admin">Super Admin</SelectItem>
                  <SelectItem value="Operation">Operation</SelectItem>
                  <SelectItem value="Customer Care">Customer Care</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@xqrentals.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile">
              Mobile No <span className="text-destructive">*</span>
            </Label>
            <Input
              id="mobile"
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="+60 12-345 6789"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as "Active" | "Inactive")}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-[#2663EB] hover:bg-[#2663EB]/90">
              Add User
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
