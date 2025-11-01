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

interface Location {
  id: string
  name: string
  address: string
  contactNumber: string
  operatingHours: string
  status: "Active" | "Inactive"
  totalPickups: number
  totalReturns: number
  createdOn: string
}

export function LocationsTable() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    contactNumber: "",
    operatingHours: "",
    status: "Active" as "Active" | "Inactive",
  })

  const [locations, setLocations] = useState<Location[]>([
    {
      id: "LOC-001",
      name: "KLIA Terminal 1",
      address: "Kuala Lumpur International Airport, Terminal 1, Sepang, Selangor",
      contactNumber: "+60312345678",
      operatingHours: "24/7",
      status: "Active",
      totalPickups: 234,
      totalReturns: 228,
      createdOn: "2024-01-01",
    },
    {
      id: "LOC-002",
      name: "KL Sentral",
      address: "KL Sentral Station, Brickfields, Kuala Lumpur",
      contactNumber: "+60322345678",
      operatingHours: "8:00 AM - 10:00 PM",
      status: "Active",
      totalPickups: 189,
      totalReturns: 192,
      createdOn: "2024-01-01",
    },
    {
      id: "LOC-003",
      name: "Penang Airport",
      address: "Penang International Airport, Bayan Lepas, Penang",
      contactNumber: "+60432345678",
      operatingHours: "6:00 AM - 12:00 AM",
      status: "Active",
      totalPickups: 156,
      totalReturns: 151,
      createdOn: "2024-01-01",
    },
  ])

  const handleOpenModal = (location?: Location) => {
    if (location) {
      setEditingLocation(location)
      setFormData({
        name: location.name,
        address: location.address,
        contactNumber: location.contactNumber,
        operatingHours: location.operatingHours,
        status: location.status,
      })
    } else {
      setEditingLocation(null)
      setFormData({
        name: "",
        address: "",
        contactNumber: "",
        operatingHours: "",
        status: "Active",
      })
    }
    setIsModalOpen(true)
  }

  const handleSave = () => {
    if (editingLocation) {
      setLocations(locations.map((loc) => (loc.id === editingLocation.id ? { ...loc, ...formData } : loc)))
      toast({
        title: "Success",
        description: "Location updated successfully",
      })
    } else {
      const newLocation: Location = {
        id: `LOC-${String(locations.length + 1).padStart(3, "0")}`,
        ...formData,
        totalPickups: 0,
        totalReturns: 0,
        createdOn: new Date().toISOString().split("T")[0],
      }
      setLocations([...locations, newLocation])
      toast({
        title: "Success",
        description: "Location added successfully",
      })
    }
    setIsModalOpen(false)
  }

  const handleDelete = (id: string) => {
    setLocations(locations.filter((loc) => loc.id !== id))
    toast({
      title: "Success",
      description: "Location deleted successfully",
    })
  }

  const filteredLocations = locations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.address.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-[#2663EB] hover:bg-[#1e4fc4] h-10 px-4">
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold text-foreground">Location ID</TableHead>
                <TableHead className="font-semibold text-foreground">Name</TableHead>
                <TableHead className="font-semibold text-foreground">Address</TableHead>
                <TableHead className="font-semibold text-foreground">Contact</TableHead>
                <TableHead className="font-semibold text-foreground">Operating Hours</TableHead>
                <TableHead className="font-semibold text-foreground">Pickups</TableHead>
                <TableHead className="font-semibold text-foreground">Returns</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="text-right font-semibold text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLocations.map((location) => (
                <TableRow key={location.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="font-mono text-sm font-medium">{location.id}</TableCell>
                  <TableCell className="font-medium">{location.name}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">{location.address}</TableCell>
                  <TableCell className="text-muted-foreground">{location.contactNumber}</TableCell>
                  <TableCell className="text-muted-foreground">{location.operatingHours}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center justify-center w-10 h-8 rounded-full bg-blue-500/10 text-blue-700 text-sm font-medium">
                      {location.totalPickups}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center justify-center w-10 h-8 rounded-full bg-purple-500/10 text-purple-700 text-sm font-medium">
                      {location.totalReturns}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={location.status === "Active" ? "default" : "secondary"}
                      className={
                        location.status === "Active" ? "bg-green-500/10 text-green-700 hover:bg-green-500/20" : ""
                      }
                    >
                      {location.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenModal(location)}
                        className="h-8 w-8 hover:bg-muted"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(location.id)}
                        className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {editingLocation ? "Edit Location" : "Add New Location"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Location Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter location name"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Address</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter full address"
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Contact Number</Label>
              <Input
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                placeholder="+60312345678"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Operating Hours</Label>
              <Input
                value={formData.operatingHours}
                onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                placeholder="e.g., 8:00 AM - 10:00 PM"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "Active" | "Inactive") => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="h-10">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-[#2663EB] hover:bg-[#1e4fc4] h-10">
              {editingLocation ? "Update" : "Add"} Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
