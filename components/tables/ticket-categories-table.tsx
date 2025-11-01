"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, Plus, Pencil, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TicketCategory {
  id: string
  categoryName: string
  description: string
  priorityLevel: "Low" | "Medium" | "High" | "Critical"
  slaTime: string
  assignedDepartment: string
  status: "Active" | "Inactive"
  createdAt: string
}

const mockTicketCategories: TicketCategory[] = [
  {
    id: "1",
    categoryName: "Vehicle Issue",
    description: "Problems with vehicle performance or condition",
    priorityLevel: "High",
    slaTime: "4 hours",
    assignedDepartment: "Maintenance",
    status: "Active",
    createdAt: "2025-01-01",
  },
  {
    id: "2",
    categoryName: "Customer Complaint",
    description: "Customer service related issues",
    priorityLevel: "Medium",
    slaTime: "24 hours",
    assignedDepartment: "Customer Care",
    status: "Active",
    createdAt: "2025-01-01",
  },
  {
    id: "3",
    categoryName: "Accident Report",
    description: "Vehicle accident or damage reports",
    priorityLevel: "Critical",
    slaTime: "1 hour",
    assignedDepartment: "Operations",
    status: "Active",
    createdAt: "2025-01-01",
  },
]

export function TicketCategoriesTable() {
  const { toast } = useToast()
  const [ticketCategories, setTicketCategories] = useState<TicketCategory[]>(mockTicketCategories)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | null>(null)
  const [formData, setFormData] = useState({
    categoryName: "",
    description: "",
    priorityLevel: "Medium" as "Low" | "Medium" | "High" | "Critical",
    slaTime: "",
    assignedDepartment: "",
    status: "Active" as "Active" | "Inactive",
  })

  const filteredCategories = ticketCategories.filter(
    (category) =>
      category.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleCreate = () => {
    const newCategory: TicketCategory = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString(),
    }
    setTicketCategories([...ticketCategories, newCategory])
    setIsCreateModalOpen(false)
    setFormData({
      categoryName: "",
      description: "",
      priorityLevel: "Medium",
      slaTime: "",
      assignedDepartment: "",
      status: "Active",
    })
    toast({ title: "Ticket category created successfully" })
  }

  const handleEdit = () => {
    if (!selectedCategory) return
    setTicketCategories(
      ticketCategories.map((category) =>
        category.id === selectedCategory.id ? { ...category, ...formData } : category,
      ),
    )
    setIsEditModalOpen(false)
    setSelectedCategory(null)
    toast({ title: "Ticket category updated successfully" })
  }

  const handleDelete = (id: string) => {
    setTicketCategories(ticketCategories.filter((category) => category.id !== id))
    toast({ title: "Ticket category deleted successfully" })
  }

  const openEditModal = (category: TicketCategory) => {
    setSelectedCategory(category)
    setFormData({
      categoryName: category.categoryName,
      description: category.description,
      priorityLevel: category.priorityLevel,
      slaTime: category.slaTime,
      assignedDepartment: category.assignedDepartment,
      status: category.status,
    })
    setIsEditModalOpen(true)
  }

  const priorityColors = {
    Low: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    Medium: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
    High: "bg-orange-500/10 text-orange-700 border-orange-500/20",
    Critical: "bg-red-500/10 text-red-700 border-red-500/20",
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-xl p-4 glass-card border-white/40">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search ticket categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-[#2663EB] hover:bg-[#2663EB]/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </Card>

      <Card className="rounded-xl overflow-hidden glass-card border-white/40">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold">Category Name</TableHead>
                <TableHead className="font-semibold">Description</TableHead>
                <TableHead className="font-semibold">Priority</TableHead>
                <TableHead className="font-semibold">SLA Time</TableHead>
                <TableHead className="font-semibold">Department</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.categoryName}</TableCell>
                  <TableCell className="text-muted-foreground">{category.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={priorityColors[category.priorityLevel]}>
                      {category.priorityLevel}
                    </Badge>
                  </TableCell>
                  <TableCell>{category.slaTime}</TableCell>
                  <TableCell>{category.assignedDepartment}</TableCell>
                  <TableCell>
                    <Badge variant={category.status === "Active" ? "default" : "secondary"}>{category.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(category)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(category.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog
        open={isCreateModalOpen || isEditModalOpen}
        onOpenChange={(open) => {
          setIsCreateModalOpen(false)
          setIsEditModalOpen(false)
          if (!open)
            setFormData({
              categoryName: "",
              description: "",
              priorityLevel: "Medium",
              slaTime: "",
              assignedDepartment: "",
              status: "Active",
            })
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditModalOpen ? "Edit Ticket Category" : "Add New Ticket Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category Name</Label>
              <Input
                value={formData.categoryName}
                onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                placeholder="e.g., Vehicle Issue"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Problems with vehicle performance"
              />
            </div>
            <div>
              <Label>Priority Level</Label>
              <select
                value={formData.priorityLevel}
                onChange={(e) => setFormData({ ...formData, priorityLevel: e.target.value as any })}
                className="w-full border rounded-md p-2"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div>
              <Label>SLA Time</Label>
              <Input
                value={formData.slaTime}
                onChange={(e) => setFormData({ ...formData, slaTime: e.target.value })}
                placeholder="e.g., 4 hours"
              />
            </div>
            <div>
              <Label>Assigned Department</Label>
              <Input
                value={formData.assignedDepartment}
                onChange={(e) => setFormData({ ...formData, assignedDepartment: e.target.value })}
                placeholder="e.g., Maintenance"
              />
            </div>
            <div>
              <Label>Status</Label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as "Active" | "Inactive" })}
                className="w-full border rounded-md p-2"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false)
                setIsEditModalOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={isEditModalOpen ? handleEdit : handleCreate}
              className="bg-[#2663EB] hover:bg-[#2663EB]/90"
            >
              {isEditModalOpen ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
