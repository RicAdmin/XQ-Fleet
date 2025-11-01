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

interface PaymentMethod {
  id: string
  methodName: string
  description: string
  processingFee: string
  status: "Active" | "Inactive"
  createdAt: string
}

const mockPaymentMethods: PaymentMethod[] = [
  {
    id: "1",
    methodName: "Cash",
    description: "Cash payment on pickup/return",
    processingFee: "0%",
    status: "Active",
    createdAt: "2025-01-01",
  },
  {
    id: "2",
    methodName: "Credit Card",
    description: "Visa, Mastercard, Amex",
    processingFee: "2.5%",
    status: "Active",
    createdAt: "2025-01-01",
  },
  {
    id: "3",
    methodName: "Bank Transfer",
    description: "Direct bank transfer",
    processingFee: "0%",
    status: "Active",
    createdAt: "2025-01-01",
  },
]

export function PaymentMethodsTable() {
  const { toast } = useToast()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(mockPaymentMethods)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [formData, setFormData] = useState({
    methodName: "",
    description: "",
    processingFee: "",
    status: "Active" as "Active" | "Inactive",
  })

  const filteredMethods = paymentMethods.filter(
    (method) =>
      method.methodName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      method.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleCreate = () => {
    const newMethod: PaymentMethod = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString(),
    }
    setPaymentMethods([...paymentMethods, newMethod])
    setIsCreateModalOpen(false)
    setFormData({ methodName: "", description: "", processingFee: "", status: "Active" })
    toast({ title: "Payment method created successfully" })
  }

  const handleEdit = () => {
    if (!selectedMethod) return
    setPaymentMethods(
      paymentMethods.map((method) => (method.id === selectedMethod.id ? { ...method, ...formData } : method)),
    )
    setIsEditModalOpen(false)
    setSelectedMethod(null)
    toast({ title: "Payment method updated successfully" })
  }

  const handleDelete = (id: string) => {
    setPaymentMethods(paymentMethods.filter((method) => method.id !== id))
    toast({ title: "Payment method deleted successfully" })
  }

  const openEditModal = (method: PaymentMethod) => {
    setSelectedMethod(method)
    setFormData({
      methodName: method.methodName,
      description: method.description,
      processingFee: method.processingFee,
      status: method.status,
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
              placeholder="Search payment methods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-[#2663EB] hover:bg-[#2663EB]/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Method
          </Button>
        </div>
      </Card>

      <Card className="rounded-xl overflow-hidden glass-card border-white/40">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold">Method Name</TableHead>
                <TableHead className="font-semibold">Description</TableHead>
                <TableHead className="font-semibold">Processing Fee</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMethods.map((method) => (
                <TableRow key={method.id}>
                  <TableCell className="font-medium">{method.methodName}</TableCell>
                  <TableCell className="text-muted-foreground">{method.description}</TableCell>
                  <TableCell>{method.processingFee}</TableCell>
                  <TableCell>
                    <Badge variant={method.status === "Active" ? "default" : "secondary"}>{method.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(method)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(method.id)}>
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
          if (!open) setFormData({ methodName: "", description: "", processingFee: "", status: "Active" })
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditModalOpen ? "Edit Payment Method" : "Add New Payment Method"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Method Name</Label>
              <Input
                value={formData.methodName}
                onChange={(e) => setFormData({ ...formData, methodName: e.target.value })}
                placeholder="e.g., Credit Card"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Visa, Mastercard, Amex"
              />
            </div>
            <div>
              <Label>Processing Fee</Label>
              <Input
                value={formData.processingFee}
                onChange={(e) => setFormData({ ...formData, processingFee: e.target.value })}
                placeholder="e.g., 2.5%"
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
