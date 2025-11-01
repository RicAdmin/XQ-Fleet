"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Pencil, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

interface AddOn {
  id: string
  name: string
  description: string
  price: number
  category: string
  status: "Active" | "Inactive"
  timesOrdered: number
  createdOn: string
}

export function AddOnsTable() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAddOn, setEditingAddOn] = useState<AddOn | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    status: "Active" as "Active" | "Inactive",
  })

  const [addOns, setAddOns] = useState<AddOn[]>([
    {
      id: "AO-001",
      name: "GPS Navigation",
      description: "Portable GPS device with latest maps",
      price: 15,
      category: "Electronics",
      status: "Active",
      timesOrdered: 89,
      createdOn: "2024-01-01",
    },
    {
      id: "AO-002",
      name: "Child Seat",
      description: "Safety child seat for ages 2-6",
      price: 20,
      category: "Safety",
      status: "Active",
      timesOrdered: 67,
      createdOn: "2024-01-01",
    },
    {
      id: "AO-003",
      name: "Additional Driver",
      description: "Add extra authorized driver",
      price: 30,
      category: "Service",
      status: "Active",
      timesOrdered: 45,
      createdOn: "2024-01-01",
    },
    {
      id: "AO-004",
      name: "WiFi Hotspot",
      description: "Portable WiFi device with unlimited data",
      price: 25,
      category: "Electronics",
      status: "Active",
      timesOrdered: 78,
      createdOn: "2024-01-01",
    },
  ])

  const handleOpenModal = (addOn?: AddOn) => {
    if (addOn) {
      setEditingAddOn(addOn)
      setFormData({
        name: addOn.name,
        description: addOn.description,
        price: addOn.price.toString(),
        category: addOn.category,
        status: addOn.status,
      })
    } else {
      setEditingAddOn(null)
      setFormData({
        name: "",
        description: "",
        price: "",
        category: "",
        status: "Active",
      })
    }
    setIsModalOpen(true)
  }

  const handleSave = () => {
    if (editingAddOn) {
      setAddOns(
        addOns.map((ao) =>
          ao.id === editingAddOn.id ? { ...ao, ...formData, price: Number.parseFloat(formData.price) } : ao,
        ),
      )
      toast({
        title: "Success",
        description: "Add-on updated successfully",
      })
    } else {
      const newAddOn: AddOn = {
        id: `AO-${String(addOns.length + 1).padStart(3, "0")}`,
        name: formData.name,
        description: formData.description,
        price: Number.parseFloat(formData.price),
        category: formData.category,
        status: formData.status,
        timesOrdered: 0,
        createdOn: new Date().toISOString().split("T")[0],
      }
      setAddOns([...addOns, newAddOn])
      toast({
        title: "Success",
        description: "Add-on added successfully",
      })
    }
    setIsModalOpen(false)
  }

  const handleDelete = (id: string) => {
    setAddOns(addOns.filter((ao) => ao.id !== id))
    toast({
      title: "Success",
      description: "Add-on deleted successfully",
    })
  }

  const filteredAddOns = addOns.filter(
    (ao) =>
      ao.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ao.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ao.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Add-ons</h2>
          <p className="text-sm text-gray-600">Manage additional services and add-ons</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-[#2663EB] hover:bg-[#1e4fc4]">
          <Plus className="h-4 w-4 mr-2" />
          Add Add-on
        </Button>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search add-ons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Add-on ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Price (RM)</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Times Ordered</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAddOns.map((addOn) => (
              <TableRow key={addOn.id}>
                <TableCell className="font-medium">{addOn.id}</TableCell>
                <TableCell>{addOn.name}</TableCell>
                <TableCell className="max-w-xs truncate">{addOn.description}</TableCell>
                <TableCell>RM {addOn.price.toFixed(2)}</TableCell>
                <TableCell>{addOn.category}</TableCell>
                <TableCell>{addOn.timesOrdered}</TableCell>
                <TableCell>
                  <Badge variant={addOn.status === "Active" ? "default" : "secondary"}>{addOn.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(addOn)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(addOn.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAddOn ? "Edit Add-on" : "Add New Add-on"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter add-on name"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Price (RM)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Electronics, Safety, Service"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "Active" | "Inactive") => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-[#2663EB] hover:bg-[#1e4fc4]">
              {editingAddOn ? "Update" : "Add"} Add-on
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
