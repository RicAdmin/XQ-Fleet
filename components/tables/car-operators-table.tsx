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
import { useToast } from "@/hooks/use-toast"

interface CarOperator {
  id: string
  name: string
  contactNumber: string
  email: string
  licenseNumber: string
  status: "Active" | "Inactive"
  assignedVehicles: number
  createdOn: string
  secondContactName?: string
  secondContactMobile?: string
  secondContactEmail?: string
}

export function CarOperatorsTable() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingOperator, setEditingOperator] = useState<CarOperator | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    contactNumber: "",
    email: "",
    licenseNumber: "",
    status: "Active" as "Active" | "Inactive",
    secondContactName: "",
    secondContactMobile: "",
    secondContactEmail: "",
  })

  const [operators, setOperators] = useState<CarOperator[]>([
    {
      id: "OP-001",
      name: "John Smith",
      contactNumber: "+60123456789",
      email: "john.smith@example.com",
      licenseNumber: "DL-12345678",
      status: "Active",
      assignedVehicles: 3,
      createdOn: "2024-01-15",
    },
    {
      id: "OP-002",
      name: "Sarah Johnson",
      contactNumber: "+60198765432",
      email: "sarah.j@example.com",
      licenseNumber: "DL-87654321",
      status: "Active",
      assignedVehicles: 2,
      createdOn: "2024-02-20",
    },
  ])

  const handleOpenModal = (operator?: CarOperator) => {
    if (operator) {
      setEditingOperator(operator)
      setFormData({
        name: operator.name,
        contactNumber: operator.contactNumber,
        email: operator.email,
        licenseNumber: operator.licenseNumber,
        status: operator.status,
        secondContactName: operator.secondContactName || "",
        secondContactMobile: operator.secondContactMobile || "",
        secondContactEmail: operator.secondContactEmail || "",
      })
    } else {
      setEditingOperator(null)
      setFormData({
        name: "",
        contactNumber: "",
        email: "",
        licenseNumber: "",
        status: "Active",
        secondContactName: "",
        secondContactMobile: "",
        secondContactEmail: "",
      })
    }
    setIsModalOpen(true)
  }

  const handleSave = () => {
    if (editingOperator) {
      setOperators(operators.map((op) => (op.id === editingOperator.id ? { ...op, ...formData } : op)))
      toast({
        title: "Success",
        description: "Car operator updated successfully",
      })
    } else {
      const newOperator: CarOperator = {
        id: `OP-${String(operators.length + 1).padStart(3, "0")}`,
        ...formData,
        assignedVehicles: 0,
        createdOn: new Date().toISOString().split("T")[0],
      }
      setOperators([...operators, newOperator])
      toast({
        title: "Success",
        description: "Car operator added successfully",
      })
    }
    setIsModalOpen(false)
  }

  const handleDelete = (id: string) => {
    setOperators(operators.filter((op) => op.id !== id))
    toast({
      title: "Success",
      description: "Car operator deleted successfully",
    })
  }

  const filteredOperators = operators.filter(
    (op) =>
      op.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-[#2663EB] hover:bg-[#1e4fc4] h-10 px-4">
          <Plus className="h-4 w-4 mr-2" />
          Add Operator
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold text-foreground">Operator ID</TableHead>
                <TableHead className="font-semibold text-foreground">Name</TableHead>
                <TableHead className="font-semibold text-foreground">Contact</TableHead>
                <TableHead className="font-semibold text-foreground">Email</TableHead>
                <TableHead className="font-semibold text-foreground">License Number</TableHead>
                <TableHead className="font-semibold text-foreground">Assigned Vehicles</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="font-semibold text-foreground">Created On</TableHead>
                <TableHead className="text-right font-semibold text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOperators.map((operator) => (
                <TableRow key={operator.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="font-mono text-sm font-medium">{operator.id}</TableCell>
                  <TableCell className="font-medium">{operator.name}</TableCell>
                  <TableCell className="text-muted-foreground">{operator.contactNumber}</TableCell>
                  <TableCell className="text-muted-foreground">{operator.email}</TableCell>
                  <TableCell className="font-mono text-sm">{operator.licenseNumber}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                      {operator.assignedVehicles}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={operator.status === "Active" ? "default" : "secondary"}
                      className={
                        operator.status === "Active" ? "bg-green-500/10 text-green-700 hover:bg-green-500/20" : ""
                      }
                    >
                      {operator.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{operator.createdOn}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenModal(operator)}
                        className="h-8 w-8 hover:bg-muted"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(operator.id)}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {editingOperator ? "Edit Operator" : "Add New Operator"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground border-b pb-2">Primary Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter operator name"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Contact Number</Label>
                  <Input
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    placeholder="+60123456789"
                    className="h-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="operator@example.com"
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground border-b pb-2">Second Contact (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Name</Label>
                  <Input
                    value={formData.secondContactName}
                    onChange={(e) => setFormData({ ...formData, secondContactName: e.target.value })}
                    placeholder="Enter second contact name"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Mobile</Label>
                  <Input
                    value={formData.secondContactMobile}
                    onChange={(e) => setFormData({ ...formData, secondContactMobile: e.target.value })}
                    placeholder="+60198765432"
                    className="h-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Email</Label>
                <Input
                  type="email"
                  value={formData.secondContactEmail}
                  onChange={(e) => setFormData({ ...formData, secondContactEmail: e.target.value })}
                  placeholder="second.contact@example.com"
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground border-b pb-2">Other Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">License Number</Label>
                  <Input
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    placeholder="DL-12345678"
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
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="h-10">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-[#2663EB] hover:bg-[#1e4fc4] h-10">
              {editingOperator ? "Update" : "Add"} Operator
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
