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

interface MaintenanceType {
  id: string
  typeName: string
  description: string
  standardCost: string
  frequency: string
  status: "Active" | "Inactive"
  createdAt: string
}

const mockMaintenanceTypes: MaintenanceType[] = [
  {
    id: "1",
    typeName: "Oil Change",
    description: "Regular engine oil and filter replacement",
    standardCost: "RM 150",
    frequency: "Every 5,000 km",
    status: "Active",
    createdAt: "2025-01-01",
  },
  {
    id: "2",
    typeName: "Tire Rotation",
    description: "Rotate tires for even wear",
    standardCost: "RM 80",
    frequency: "Every 10,000 km",
    status: "Active",
    createdAt: "2025-01-01",
  },
  {
    id: "3",
    typeName: "Brake Inspection",
    description: "Check brake pads and fluid",
    standardCost: "RM 100",
    frequency: "Every 15,000 km",
    status: "Active",
    createdAt: "2025-01-01",
  },
]

export function MaintenanceTypesTable() {
  const { toast } = useToast()
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>(mockMaintenanceTypes)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<MaintenanceType | null>(null)
  const [formData, setFormData] = useState({
    typeName: "",
    description: "",
    standardCost: "",
    frequency: "",
    status: "Active" as "Active" | "Inactive",
  })

  const filteredTypes = maintenanceTypes.filter(
    (type) =>
      type.typeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      type.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleCreate = () => {
    const newType: MaintenanceType = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString(),
    }
    setMaintenanceTypes([...maintenanceTypes, newType])
    setIsCreateModalOpen(false)
    setFormData({ typeName: "", description: "", standardCost: "", frequency: "", status: "Active" })
    toast({ title: "Maintenance type created successfully" })
  }

  const handleEdit = () => {
    if (!selectedType) return
    setMaintenanceTypes(maintenanceTypes.map((type) => (type.id === selectedType.id ? { ...type, ...formData } : type)))
    setIsEditModalOpen(false)
    setSelectedType(null)
    toast({ title: "Maintenance type updated successfully" })
  }

  const handleDelete = (id: string) => {
    setMaintenanceTypes(maintenanceTypes.filter((type) => type.id !== id))
    toast({ title: "Maintenance type deleted successfully" })
  }

  const openEditModal = (type: MaintenanceType) => {
    setSelectedType(type)
    setFormData({
      typeName: type.typeName,
      description: type.description,
      standardCost: type.standardCost,
      frequency: type.frequency,
      status: type.status,
    })
    setIsEditModalOpen(true)
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-xl p-4 glass-card border-white/40">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search maintenance types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-[#2663EB] hover:bg-[#2663EB]/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Type
          </Button>
        </div>
      </Card>

      <Card className="rounded-xl overflow-hidden glass-card border-white/40">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold">Type Name</TableHead>
                <TableHead className="font-semibold">Description</TableHead>
                <TableHead className="font-semibold">Standard Cost</TableHead>
                <TableHead className="font-semibold">Frequency</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-medium">{type.typeName}</TableCell>
                  <TableCell className="text-muted-foreground">{type.description}</TableCell>
                  <TableCell>{type.standardCost}</TableCell>
                  <TableCell>{type.frequency}</TableCell>
                  <TableCell>
                    <Badge variant={type.status === "Active" ? "default" : "secondary"}>{type.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(type)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(type.id)}>
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
          if (!open) setFormData({ typeName: "", description: "", standardCost: "", frequency: "", status: "Active" })
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditModalOpen ? "Edit Maintenance Type" : "Add New Maintenance Type"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type Name</Label>
              <Input
                value={formData.typeName}
                onChange={(e) => setFormData({ ...formData, typeName: e.target.value })}
                placeholder="e.g., Oil Change"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Regular engine oil and filter replacement"
              />
            </div>
            <div>
              <Label>Standard Cost</Label>
              <Input
                value={formData.standardCost}
                onChange={(e) => setFormData({ ...formData, standardCost: e.target.value })}
                placeholder="e.g., RM 150"
              />
            </div>
            <div>
              <Label>Frequency</Label>
              <Input
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                placeholder="e.g., Every 5,000 km"
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
