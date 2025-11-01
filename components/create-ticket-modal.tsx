"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, X, Search, FileVideo, FileImage } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type TicketStatus = "Open" | "In Review" | "Resolved"
type TicketSeverity = "Low" | "Medium" | "High"
type TicketType = "Accident" | "Extend Hour" | "Complaint"

interface CreateTicketModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateTicket: (ticket: {
    carPlate: string
    carModel: string
    carImage: string
    type: TicketType
    severity: TicketSeverity
    status: TicketStatus
    reportedBy: string
    createdDate: string
    description: string
    photos: string[]
    linkedBooking?: string
    assignedTo?: string
  }) => void
}

const mockCars = [
  { plate: "WXY 1234", model: "Toyota Camry", image: "/toyota-camry-sedan.png" },
  { plate: "ABC 5678", model: "Honda Odyssey", image: "/honda-odyssey-mpv.jpg" },
  { plate: "DEF 9012", model: "Ford Explorer", image: "/ford-explorer-suv.jpg" },
  { plate: "GHI 3456", model: "Nissan Altima", image: "/nissan-altima-sedan.jpg" },
  { plate: "JKL 7890", model: "Chevrolet Tahoe", image: "/chevrolet-tahoe-suv.jpg" },
]

const mockPICs = ["Ahmad Hassan", "Sarah Lee", "John Tan", "Emily Wong", "Michael Lim", "David Chen", "Lisa Kumar"]

export function CreateTicketModal({ open, onOpenChange, onCreateTicket }: CreateTicketModalProps) {
  const [selectedCar, setSelectedCar] = useState("")
  const [type, setType] = useState<TicketType>("Complaint")
  const [severity, setSeverity] = useState<TicketSeverity>("Low")
  const [description, setDescription] = useState("")
  const [linkedBooking, setLinkedBooking] = useState("")
  const [reportedBy, setReportedBy] = useState("Staff")
  const [assignedTo, setAssignedTo] = useState("")
  const [picSearchOpen, setPicSearchOpen] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter((file) => {
      const isValidType = file.type.startsWith("image/") || file.type.startsWith("video/")
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB
      if (!isValidType) {
        alert(`${file.name} is not a valid image or video file`)
        return false
      }
      if (!isValidSize) {
        alert(`${file.name} exceeds 10MB limit`)
        return false
      }
      return true
    })
    setUploadedFiles([...uploadedFiles, ...validFiles])
  }

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const car = mockCars.find((c) => c.plate === selectedCar)
    if (!car) return

    onCreateTicket({
      carPlate: car.plate,
      carModel: car.model,
      carImage: car.image,
      type,
      severity,
      status: "Open",
      reportedBy,
      createdDate: new Date().toISOString().split("T")[0],
      description,
      photos: [],
      linkedBooking: linkedBooking || undefined,
      assignedTo: assignedTo || undefined,
    })

    // Reset form
    setSelectedCar("")
    setType("Complaint")
    setSeverity("Low")
    setDescription("")
    setLinkedBooking("")
    setReportedBy("Staff")
    setAssignedTo("")
    setUploadedFiles([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New Ticket</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Car Selection */}
            <div className="space-y-2">
              <Label htmlFor="car" className="text-sm font-medium">
                Car <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedCar} onValueChange={setSelectedCar} required>
                <SelectTrigger id="car" className="h-10">
                  <SelectValue placeholder="Select a car" />
                </SelectTrigger>
                <SelectContent>
                  {mockCars.map((car) => (
                    <SelectItem key={car.plate} value={car.plate}>
                      {car.plate} - {car.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-medium">
                Type <span className="text-red-500">*</span>
              </Label>
              <Select value={type} onValueChange={(value) => setType(value as TicketType)} required>
                <SelectTrigger id="type" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Accident">Accident</SelectItem>
                  <SelectItem value="Extend Hour">Extend Hour</SelectItem>
                  <SelectItem value="Complaint">Complaint</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Severity */}
            <div className="space-y-2">
              <Label htmlFor="severity" className="text-sm font-medium">
                Severity <span className="text-red-500">*</span>
              </Label>
              <Select value={severity} onValueChange={(value) => setSeverity(value as TicketSeverity)} required>
                <SelectTrigger id="severity" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reported By */}
            <div className="space-y-2">
              <Label htmlFor="reportedBy" className="text-sm font-medium">
                Reported By <span className="text-red-500">*</span>
              </Label>
              <Input
                id="reportedBy"
                value={reportedBy}
                onChange={(e) => setReportedBy(e.target.value)}
                placeholder="Staff name or Customer"
                className="h-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedTo" className="text-sm font-medium">
              Assign to PIC (Person In Charge)
            </Label>
            <Popover open={picSearchOpen} onOpenChange={setPicSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={picSearchOpen}
                  className="w-full justify-between h-10 font-normal bg-transparent"
                >
                  {assignedTo || "Search or enter PIC name..."}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Search PIC..."
                    value={assignedTo}
                    onValueChange={setAssignedTo}
                    className="h-10"
                  />
                  <CommandList>
                    <CommandEmpty>
                      <div className="p-2 text-sm">
                        Press Enter to use "{assignedTo}" as PIC name
                        <Button
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => {
                            setPicSearchOpen(false)
                          }}
                        >
                          Use "{assignedTo}"
                        </Button>
                      </div>
                    </CommandEmpty>
                    <CommandGroup>
                      {mockPICs.map((pic) => (
                        <CommandItem
                          key={pic}
                          value={pic}
                          onSelect={(value) => {
                            setAssignedTo(value)
                            setPicSearchOpen(false)
                          }}
                        >
                          {pic}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description / Notes <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
              rows={4}
              className="resize-none"
              required
            />
          </div>

          {/* Optional Booking ID */}
          <div className="space-y-2">
            <Label htmlFor="linkedBooking" className="text-sm font-medium">
              Linked Job ID (Optional)
            </Label>
            <Input
              id="linkedBooking"
              value={linkedBooking}
              onChange={(e) => setLinkedBooking(e.target.value)}
              placeholder="e.g., JOB-2025-001"
              className="h-10"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Upload Photos or Videos (Optional)</Label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-[#FF8945] hover:bg-accent/5 transition-all cursor-pointer"
            >
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground mb-1">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground">Images (PNG, JPG) or Videos (MP4, MOV) up to 10MB each</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <div className="border rounded-lg p-3 bg-accent/5 hover:bg-accent/10 transition-colors">
                        <div className="flex items-center gap-2">
                          {file.type.startsWith("image/") ? (
                            <FileImage className="h-5 w-5 text-blue-500 flex-shrink-0" />
                          ) : (
                            <FileVideo className="h-5 w-5 text-purple-500 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-10 px-6">
              Cancel
            </Button>
            <Button type="submit" className="h-10 px-6 bg-[#2663EB] hover:bg-[#2663EB]/90">
              Create Ticket
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
