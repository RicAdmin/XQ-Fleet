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

interface CarBrand {
  id: string
  brandName: string
  models: string[]
  status: "Active" | "Inactive"
  createdAt: string
}

const mockCarBrands: CarBrand[] = [
  {
    id: "1",
    brandName: "Toyota",
    models: ["Camry", "Corolla", "RAV4", "Highlander"],
    status: "Active",
    createdAt: "2025-01-01",
  },
  {
    id: "2",
    brandName: "Honda",
    models: ["Civic", "Accord", "CR-V", "Odyssey"],
    status: "Active",
    createdAt: "2025-01-01",
  },
  {
    id: "3",
    brandName: "Ford",
    models: ["F-150", "Explorer", "Mustang", "Escape"],
    status: "Active",
    createdAt: "2025-01-01",
  },
]

export function CarBrandsTable() {
  const { toast } = useToast()
  const [carBrands, setCarBrands] = useState<CarBrand[]>(mockCarBrands)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<CarBrand | null>(null)
  const [formData, setFormData] = useState({
    brandName: "",
    models: "",
    status: "Active" as "Active" | "Inactive",
  })

  const filteredBrands = carBrands.filter(
    (brand) =>
      brand.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brand.models.some((model) => model.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const handleCreate = () => {
    const newBrand: CarBrand = {
      id: Date.now().toString(),
      brandName: formData.brandName,
      models: formData.models.split(",").map((m) => m.trim()),
      status: formData.status,
      createdAt: new Date().toISOString(),
    }
    setCarBrands([...carBrands, newBrand])
    setIsCreateModalOpen(false)
    setFormData({ brandName: "", models: "", status: "Active" })
    toast({ title: "Car brand created successfully" })
  }

  const handleEdit = () => {
    if (!selectedBrand) return
    setCarBrands(
      carBrands.map((brand) =>
        brand.id === selectedBrand.id
          ? {
              ...brand,
              brandName: formData.brandName,
              models: formData.models.split(",").map((m) => m.trim()),
              status: formData.status,
            }
          : brand,
      ),
    )
    setIsEditModalOpen(false)
    setSelectedBrand(null)
    toast({ title: "Car brand updated successfully" })
  }

  const handleDelete = (id: string) => {
    setCarBrands(carBrands.filter((brand) => brand.id !== id))
    toast({ title: "Car brand deleted successfully" })
  }

  const openEditModal = (brand: CarBrand) => {
    setSelectedBrand(brand)
    setFormData({
      brandName: brand.brandName,
      models: brand.models.join(", "),
      status: brand.status,
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
              placeholder="Search by brand or model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-[#2663EB] hover:bg-[#2663EB]/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Brand
          </Button>
        </div>
      </Card>

      <Card className="rounded-xl overflow-hidden glass-card border-white/40">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold">Brand Name</TableHead>
                <TableHead className="font-semibold">Models</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Created At</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBrands.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell className="font-medium">{brand.brandName}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {brand.models.map((model, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {model}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={brand.status === "Active" ? "default" : "secondary"}>{brand.status}</Badge>
                  </TableCell>
                  <TableCell>{new Date(brand.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(brand)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(brand.id)}>
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
          if (!open) setFormData({ brandName: "", models: "", status: "Active" })
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditModalOpen ? "Edit Car Brand" : "Add New Car Brand"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Brand Name</Label>
              <Input
                value={formData.brandName}
                onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                placeholder="e.g., Toyota"
              />
            </div>
            <div>
              <Label>Models (comma-separated)</Label>
              <Input
                value={formData.models}
                onChange={(e) => setFormData({ ...formData, models: e.target.value })}
                placeholder="e.g., Camry, Corolla, RAV4"
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
