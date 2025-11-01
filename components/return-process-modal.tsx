"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, ZoomIn } from "lucide-react"
import { format, differenceInHours } from "date-fns"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Image from "next/image"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

interface Job {
  id: string
  jobId: string
  carName: string
  customerName: string
  startDate: string
  endDate: string
  returnHour?: string
  totalAmount: number
  carFuelGaugeType?: "Analog needle" | "Digital bars" | "Percentage on dash" | "Distance to empty on dash"
}

interface ProcessLog {
  id: string
  timestamp: string
  processType: string
  operator: string
  mileage?: string
  fuelLevel?: string
  images?: string[]
  extendedHours?: number
  extraFee?: number
}

interface ReturnProcessModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  job: Job | null
}

export function ReturnProcessModal({ open, onOpenChange, job }: ReturnProcessModalProps) {
  const [markAsReturn, setMarkAsReturn] = useState(false)
  const [mileage, setMileage] = useState("")
  const [fuelLevel, setFuelLevel] = useState("")
  const [fuelBarsLit, setFuelBarsLit] = useState("")
  const [fuelBarsTotal, setFuelBarsTotal] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [instrumentPanelImages, setInstrumentPanelImages] = useState<string[]>([])
  const [processLogs, setProcessLogs] = useState<ProcessLog[]>([])
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [extendedHours, setExtendedHours] = useState(0)
  const [extraFee, setExtraFee] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    if (!job) return

    const orderedReturnDate = new Date(job.endDate)
    const currentDate = new Date()

    if (currentDate > orderedReturnDate) {
      const hours = differenceInHours(currentDate, orderedReturnDate)
      setExtendedHours(hours)
      // Assuming RM 50 per hour for extended return
      setExtraFee(hours * 50)
    } else {
      setExtendedHours(0)
      setExtraFee(0)
    }
  }, [job])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newImages: string[] = []
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        newImages.push(reader.result as string)
        if (newImages.length === files.length) {
          setImages([...images, ...newImages])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleInstrumentPanelImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newImages: string[] = []
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        newImages.push(reader.result as string)
        if (newImages.length === files.length) {
          setInstrumentPanelImages([...instrumentPanelImages, ...newImages])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const removeInstrumentPanelImage = (index: number) => {
    setInstrumentPanelImages(instrumentPanelImages.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    const newLog: ProcessLog = {
      id: String(processLogs.length + 1),
      timestamp: new Date().toLocaleString(),
      processType: "Return",
      operator: "Current User",
      mileage,
      fuelLevel,
      images: [...images],
      extendedHours: extendedHours > 0 ? extendedHours : undefined,
      extraFee: extraFee > 0 ? extraFee : undefined,
    }
    setProcessLogs([newLog, ...processLogs])

    toast({
      title: "Success",
      description: "Return process saved successfully",
    })

    // Reset form
    setMileage("")
    setFuelLevel("")
    setImages([])
    setInstrumentPanelImages([])
    setMarkAsReturn(false)
  }

  const renderFuelLevelInput = () => {
    const gaugeType = job?.carFuelGaugeType || "Analog needle"

    switch (gaugeType) {
      case "Analog needle":
        return (
          <select
            id="returnFuelLevel"
            value={fuelLevel}
            onChange={(e) => setFuelLevel(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Select level</option>
            <option value="0">Empty (0)</option>
            <option value="0.125">1/8</option>
            <option value="0.25">1/4</option>
            <option value="0.375">3/8</option>
            <option value="0.5">1/2</option>
            <option value="0.625">5/8</option>
            <option value="0.75">3/4</option>
            <option value="0.875">7/8</option>
            <option value="1">Full (1)</option>
          </select>
        )
      case "Digital bars":
        return (
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              value={fuelBarsLit}
              onChange={(e) => setFuelBarsLit(e.target.value)}
              placeholder="Bars lit"
              className="h-9"
              min="0"
            />
            <Input
              type="number"
              value={fuelBarsTotal}
              onChange={(e) => setFuelBarsTotal(e.target.value)}
              placeholder="Bars total"
              className="h-9"
              min="1"
            />
          </div>
        )
      case "Percentage on dash":
        return (
          <Input
            id="returnFuelLevel"
            type="number"
            value={fuelLevel}
            onChange={(e) => setFuelLevel(e.target.value)}
            placeholder="0-100%"
            min="0"
            max="100"
            className="h-9"
          />
        )
      case "Distance to empty on dash":
        return (
          <Input
            id="returnFuelLevel"
            type="number"
            value={fuelLevel}
            onChange={(e) => setFuelLevel(e.target.value)}
            placeholder="Distance in km"
            min="0"
            className="h-9"
          />
        )
    }
  }

  if (!job) return null

  const orderedReturnDateTime = `${format(new Date(job.endDate), "MMMM do, yyyy")} | ${job.returnHour || "9:00 AM"}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg font-semibold">Return Process - {job.jobId}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {job.carName} • {job.customerName}
          </p>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Card className="p-2.5 bg-muted/30">
            <h3 className="font-semibold text-sm mb-1.5">Return Section</h3>
            <div className="text-sm mb-2">
              <span className="text-muted-foreground">Ordered Return Date | Time : </span>
              <span className="font-medium">{orderedReturnDateTime}</span>
            </div>

            {extendedHours > 0 && (
              <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30 mt-2">
                <p className="text-sm font-semibold text-orange-700">
                  Extended: {extendedHours} hours | Extra Fee: RM {extraFee}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Late return charges apply</p>
              </div>
            )}
          </Card>

          {/* Vehicle Condition Section */}
          <Card className="p-2.5 bg-background">
            <h3 className="font-semibold text-sm mb-2">Vehicle Condition (Upon Return)</h3>

            <div className="space-y-1.5 mb-3 pb-3 border-b">
              <Label className="text-sm font-medium">Upload Instrument Panel Images</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("return-instrument-panel-upload")?.click()}
                  className="h-9"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Panel Images
                </Button>
                <input
                  id="return-instrument-panel-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleInstrumentPanelImageUpload}
                />
              </div>

              {instrumentPanelImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {instrumentPanelImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <Image
                        src={img || "/placeholder.svg"}
                        alt={`Panel ${index + 1}`}
                        width={100}
                        height={100}
                        className="rounded-lg object-cover w-full h-20 cursor-pointer"
                        onClick={() => setPreviewImage(img)}
                      />
                      <button
                        onClick={() => removeInstrumentPanelImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => setPreviewImage(img)}
                        className="absolute bottom-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ZoomIn className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-2">
              <div className="space-y-1">
                <Label htmlFor="returnMileage" className="text-sm">
                  Mileage (km)
                </Label>
                <Input
                  id="returnMileage"
                  type="number"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  placeholder="Enter mileage"
                  className="h-9"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="returnFuelLevel" className="text-sm">
                  Fuel Level
                  {job?.carFuelGaugeType === "Percentage on dash" && " (%)"}
                  {job?.carFuelGaugeType === "Distance to empty on dash" && " (km)"}
                </Label>
                {renderFuelLevelInput()}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Upload Vehicle Photos</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("return-image-upload")?.click()}
                  className="h-9"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Images
                </Button>
                <input
                  id="return-image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <Image
                        src={img || "/placeholder.svg"}
                        alt={`Return ${index + 1}`}
                        width={100}
                        height={100}
                        className="rounded-lg object-cover w-full h-20 cursor-pointer"
                        onClick={() => setPreviewImage(img)}
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => setPreviewImage(img)}
                        className="absolute bottom-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ZoomIn className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card className="p-2.5 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
            <div className="flex items-center space-x-2.5">
              <Switch
                id="markAsReturn"
                checked={markAsReturn}
                onCheckedChange={setMarkAsReturn}
                className="data-[state=checked]:bg-blue-600"
              />
              <label
                htmlFor="markAsReturn"
                className="text-sm font-semibold cursor-pointer text-blue-700 dark:text-blue-400"
              >
                Mark as Return
              </label>
            </div>
          </Card>
        </div>

        {processLogs.length > 0 && (
          <div className="border-t pt-3 mt-3">
            <h3 className="font-semibold text-sm mb-3 text-foreground">All Pickup & Return Process History</h3>
            <div className="rounded-lg border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold text-xs">Timestamp</TableHead>
                      <TableHead className="font-semibold text-xs">Process Type</TableHead>
                      <TableHead className="font-semibold text-xs">Operator</TableHead>
                      <TableHead className="font-semibold text-xs">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-xs">{log.timestamp}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                            {log.processType}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-xs">{log.operator}</TableCell>
                        <TableCell>
                          <div className="space-y-0.5 text-xs">
                            {log.mileage && (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Mileage:</span>
                                <span className="font-medium">{log.mileage} km</span>
                              </div>
                            )}
                            {log.fuelLevel && (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Fuel:</span>
                                <span className="font-medium">{log.fuelLevel}%</span>
                              </div>
                            )}
                            {log.extendedHours && (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Extended:</span>
                                <span className="font-semibold text-orange-600">{log.extendedHours} hours</span>
                              </div>
                            )}
                            {log.extraFee && (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Extra Fee:</span>
                                <span className="font-semibold text-orange-600">RM {log.extraFee}</span>
                              </div>
                            )}
                            {log.images && log.images.length > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Images:</span>
                                <span className="font-medium">{log.images.length} uploaded</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2 pt-3 border-t mt-3">
          <Button onClick={handleSave} className="h-9 flex-1 bg-[#2663EB] hover:bg-[#2663EB]/90">
            Save
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-9 flex-1">
            Close
          </Button>
        </DialogFooter>

        {previewImage && (
          <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Image Preview</DialogTitle>
              </DialogHeader>
              <div className="relative w-full h-[70vh]">
                <Image src={previewImage || "/placeholder.svg"} alt="Preview" fill className="object-contain" />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}
