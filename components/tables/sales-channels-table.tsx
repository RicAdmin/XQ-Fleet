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

interface SalesChannel {
  id: string
  name: string
  description: string
  status: "Active" | "Inactive"
  totalOrders: number
  createdOn: string
}

export function SalesChannelsTable() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingChannel, setEditingChannel] = useState<SalesChannel | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "Active" as "Active" | "Inactive",
  })

  const [channels, setChannels] = useState<SalesChannel[]>([
    {
      id: "SC-001",
      name: "WhatsApp",
      description: "Orders received via WhatsApp messaging",
      status: "Active",
      totalOrders: 145,
      createdOn: "2024-01-01",
    },
    {
      id: "SC-002",
      name: "Website",
      description: "Direct bookings from company website",
      status: "Active",
      totalOrders: 289,
      createdOn: "2024-01-01",
    },
    {
      id: "SC-003",
      name: "Phone",
      description: "Phone call bookings",
      status: "Active",
      totalOrders: 98,
      createdOn: "2024-01-01",
    },
    {
      id: "SC-004",
      name: "Walk-in",
      description: "Walk-in customers at office",
      status: "Active",
      totalOrders: 56,
      createdOn: "2024-01-01",
    },
    {
      id: "SC-005",
      name: "WeChat",
      description: "Orders via WeChat platform",
      status: "Active",
      totalOrders: 34,
      createdOn: "2024-01-01",
    },
    {
      id: "SC-006",
      name: "Social",
      description: "Social media platforms (Facebook, Instagram)",
      status: "Active",
      totalOrders: 67,
      createdOn: "2024-01-01",
    },
    {
      id: "SC-007",
      name: "Messaging",
      description: "Other messaging apps",
      status: "Active",
      totalOrders: 23,
      createdOn: "2024-01-01",
    },
  ])

  const handleOpenModal = (channel?: SalesChannel) => {
    if (channel) {
      setEditingChannel(channel)
      setFormData({
        name: channel.name,
        description: channel.description,
        status: channel.status,
      })
    } else {
      setEditingChannel(null)
      setFormData({
        name: "",
        description: "",
        status: "Active",
      })
    }
    setIsModalOpen(true)
  }

  const handleSave = () => {
    if (editingChannel) {
      setChannels(channels.map((ch) => (ch.id === editingChannel.id ? { ...ch, ...formData } : ch)))
      toast({
        title: "Success",
        description: "Sales channel updated successfully",
      })
    } else {
      const newChannel: SalesChannel = {
        id: `SC-${String(channels.length + 1).padStart(3, "0")}`,
        ...formData,
        totalOrders: 0,
        createdOn: new Date().toISOString().split("T")[0],
      }
      setChannels([...channels, newChannel])
      toast({
        title: "Success",
        description: "Sales channel added successfully",
      })
    }
    setIsModalOpen(false)
  }

  const handleDelete = (id: string) => {
    setChannels(channels.filter((ch) => ch.id !== id))
    toast({
      title: "Success",
      description: "Sales channel deleted successfully",
    })
  }

  const filteredChannels = channels.filter(
    (ch) =>
      ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.id.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-[#2663EB] hover:bg-[#1e4fc4] h-10 px-4">
          <Plus className="h-4 w-4 mr-2" />
          Add Channel
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold text-foreground">Channel ID</TableHead>
                <TableHead className="font-semibold text-foreground">Name</TableHead>
                <TableHead className="font-semibold text-foreground">Description</TableHead>
                <TableHead className="font-semibold text-foreground">Total Orders</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="font-semibold text-foreground">Created On</TableHead>
                <TableHead className="text-right font-semibold text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChannels.map((channel) => (
                <TableRow key={channel.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="font-mono text-sm font-medium">{channel.id}</TableCell>
                  <TableCell className="font-medium">{channel.name}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">{channel.description}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center justify-center min-w-[2.5rem] h-8 px-2 rounded-full bg-muted text-sm font-medium">
                      {channel.totalOrders}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={channel.status === "Active" ? "default" : "secondary"}
                      className={
                        channel.status === "Active" ? "bg-green-500/10 text-green-700 hover:bg-green-500/20" : ""
                      }
                    >
                      {channel.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{channel.createdOn}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenModal(channel)}
                        className="h-8 w-8 hover:bg-muted"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(channel.id)}
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
              {editingChannel ? "Edit Channel" : "Add New Channel"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Channel Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter channel name"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter channel description"
                rows={3}
                className="resize-none"
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
              {editingChannel ? "Update" : "Add"} Channel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
