"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Upload, X, ZoomIn } from "lucide-react"
import { format, differenceInHours, parse } from "date-fns"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"

interface Job {
  id: string
  jobId: string
  carName: string
  customerName: string
  startDate: string
  endDate: string
  pickupHour?: string
  returnHour?: string
  totalAmount: number
  depositAmount?: number
  carFuelGaugeType?: "Analog needle" | "Digital bars" | "Percentage on dash" | "Distance to empty on dash"
}

interface ProcessLog {
  id: string
  timestamp: string
  operator: string
  actualPickupDate?: string
  actualPickupTime?: string
  diffAmount?: number
  diffAmountReceived?: number
  depositReceived?: number
  mileage?: string
  fuelLevel?: string
  images?: string[]
  instrumentPanelImages?: string[]
}

interface PickupProcessModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  job: Job | null
}

const availableHours = [
  "7:00 AM",
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
  "8:00 PM",
  "9:00 PM",
  "10:00 PM",
]

export function PickupProcessModal({ open, onOpenChange, job }: PickupProcessModalProps) {
  const [carAgreementId, setCarAgreementId] = useState("")
  const [isDifferentPickupTime, setIsDifferentPickupTime] = useState(false)
  const [markAsPicked, setMarkAsPicked] = useState(false)
  const [actualPickupDate, setActualPickupDate] = useState<Date>()
  const [actualPickupHour, setActualPickupHour] = useState("")
  const [diffAmount, setDiffAmount] = useState(0)
  const [diffAmountReceived, setDiffAmountReceived] = useState("")
  const [depositReceived, setDepositReceived] = useState("")
  const [mileage, setMileage] = useState("")
  const [fuelLevel, setFuelLevel] = useState("")
  const [fuelBarsLit, setFuelBarsLit] = useState("")
  const [fuelBarsTotal, setFuelBarsTotal] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [instrumentPanelImages, setInstrumentPanelImages] = useState<string[]>([])
  const [processLogs, setProcessLogs] = useState<ProcessLog[]>([])
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (!job || !isDifferentPickupTime || !actualPickupDate || !actualPickupHour) {
      setDiffAmount(0)
      return
    }

    const orderedPickupDate = new Date(job.startDate)
    const orderedPickupTime = parse(job.pickupHour || "9:00 AM", "h:mm a", orderedPickupDate)
    const actualPickupTime = parse(actualPickupHour, "h:mm a", actualPickupDate)

    const hoursDiff = Math.abs(differenceInHours(actualPickupTime, orderedPickupTime))
    const hourlyRate = 50
    const calculatedFee = hoursDiff * hourlyRate

    setDiffAmount(calculatedFee)
  }, [job, isDifferentPickupTime, actualPickupDate, actualPickupHour])

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
    if (!carAgreementId.trim()) {
      toast({
        title: "Validation Error",
        description: "Car Agreement ID is required",
        variant: "destructive",
      })
      return
    }

    const newLog: ProcessLog = {
      id: String(processLogs.length + 1),
      timestamp: new Date().toLocaleString(),
      operator: "Current User",
      actualPickupDate: actualPickupDate ? format(actualPickupDate, "PPP") : undefined,
      actualPickupTime: actualPickupHour || undefined,
      diffAmount: diffAmount > 0 ? diffAmount : undefined,
      diffAmountReceived: diffAmountReceived ? Number(diffAmountReceived) : undefined,
      depositReceived: depositReceived ? Number(depositReceived) : undefined,
      mileage,
      fuelLevel,
      images: [...images],
      instrumentPanelImages: [...instrumentPanelImages],
    }
    setProcessLogs([newLog, ...processLogs])

    toast({
      title: "Success",
      description: "Pickup process saved successfully",
    })

    setCarAgreementId("")
    setIsDifferentPickupTime(false)
    setActualPickupDate(undefined)
    setActualPickupHour("")
    setDiffAmountReceived("")
    setDepositReceived("")
    setMileage("")
    setFuelLevel("")
    setFuelBarsLit("")
    setFuelBarsTotal("")
    setImages([])
    setInstrumentPanelImages([])
  }

  const renderFuelLevelInput = () => {
    const gaugeType = job?.carFuelGaugeType || "Analog needle"

    switch (gaugeType) {
      case "Analog needle":
        return (
          <select
            id="fuelLevel"
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
            id="fuelLevel"
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
            id="fuelLevel"
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

  const orderedPickupDateTime = `${format(new Date(job.startDate), "MMMM do, yyyy")} | ${job.pickupHour || "9:00 AM"}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-xl font-semibold">Pickup Process - {job.jobId}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {job.carName} • {job.customerName}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="carAgreementId" className="text-sm font-medium">
              Car Agreement ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="carAgreementId"
              value={carAgreementId}
              onChange={(e) => setCarAgreementId(e.target.value)}
              placeholder="Enter car agreement ID"
              className="h-10"
              required
            />
          </div>

          <Card className="p-3 bg-muted/30">
            <h3 className="font-semibold text-sm mb-2">Pickup Section</h3>
            <div className="text-sm mb-3">
              <span className="text-muted-foreground">Ordered Pickup Date | Time : </span>
              <span className="font-medium">{orderedPickupDateTime}</span>
            </div>

            <div className="flex items-center space-x-3 p-2.5 rounded-lg border bg-background">
              <Switch
                id="differentPickupTime"
                checked={isDifferentPickupTime}
                onCheckedChange={setIsDifferentPickupTime}
                className="data-[state=checked]:bg-[#FF8945]"
              />
              <label htmlFor="differentPickupTime" className="text-sm font-medium cursor-pointer">
                Different Pickup Date/time
              </label>
            </div>
          </Card>

          {isDifferentPickupTime && (
            <Card className="p-3 border-[#FF8945]/30 bg-[#FF8945]/5">
              <h3 className="font-semibold text-sm mb-3">Diff-Time Section</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Actual Pickup Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-10",
                          !actualPickupDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {actualPickupDate ? format(actualPickupDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={actualPickupDate} onSelect={setActualPickupDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="actualPickupHour" className="text-sm">
                    Actual Pickup Time
                  </Label>
                  <select
                    id="actualPickupHour"
                    value={actualPickupHour}
                    onChange={(e) => setActualPickupHour(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Select time</option>
                    {availableHours.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {diffAmount > 0 && (
                <div className="space-y-2.5">
                  <div className="p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <p className="text-sm font-semibold text-yellow-700">Diff Amount to be Paid: ${diffAmount}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Additional charges due to time difference</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="diffAmountReceived" className="text-sm">
                      Diff Amount Received ($)
                    </Label>
                    <Input
                      id="diffAmountReceived"
                      type="number"
                      value={diffAmountReceived}
                      onChange={(e) => setDiffAmountReceived(e.target.value)}
                      placeholder={String(diffAmount)}
                      className="h-9"
                    />
                  </div>
                </div>
              )}
            </Card>
          )}

          <Card className="p-3 bg-background">
            <h3 className="font-semibold text-sm mb-3">Deposit Section</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Deposit Amount ($)</Label>
                <Input type="text" value={`$${job?.depositAmount || 0}`} disabled className="h-9 bg-muted" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="depositReceived" className="text-sm">
                  Received Deposit Amount ($)
                </Label>
                <Input
                  id="depositReceived"
                  type="number"
                  value={depositReceived}
                  onChange={(e) => setDepositReceived(e.target.value)}
                  placeholder={String(job?.depositAmount || 0)}
                  className="h-9"
                />
              </div>
            </div>
          </Card>

          <Card className="p-3 bg-background">
            <h3 className="font-semibold text-sm mb-3">Additional Info Section</h3>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="space-y-1.5">
                <Label htmlFor="mileage" className="text-sm">
                  Mileage (km)
                </Label>
                <Input
                  id="mileage"
                  type="number"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  placeholder="Enter mileage"
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fuelLevel" className="text-sm">
                  Fuel Level
                  {job?.carFuelGaugeType === "Percentage on dash" && " (%)"}
                  {job?.carFuelGaugeType === "Distance to empty on dash" && " (km)"}
                </Label>
                {renderFuelLevelInput()}
              </div>
            </div>

            <div className="space-y-2 mb-3 pb-3 border-b">
              <Label className="text-sm font-medium">Upload Instrument Panel Images</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("instrument-panel-upload")?.click()}
                  className="h-9"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Panel Images
                </Button>
                <input
                  id="instrument-panel-upload"
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

            <div className="space-y-2">
              <Label className="text-sm">Upload Images (Driver License, Passport, etc.)</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("pickup-image-upload")?.click()}
                  className="h-9"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Images
                </Button>
                <input
                  id="pickup-image-upload"
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
                        alt={`Upload ${index + 1}`}
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

          <Card className="p-3 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
            <div className="flex items-center space-x-3">
              <Switch
                id="markAsPicked"
                checked={markAsPicked}
                onCheckedChange={setMarkAsPicked}
                className="data-[state=checked]:bg-green-600"
              />
              <label
                htmlFor="markAsPicked"
                className="text-sm font-semibold cursor-pointer text-green-700 dark:text-green-400"
              >
                Mark as Picked
              </label>
            </div>
          </Card>
        </div>

        {processLogs.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold text-base mb-4 text-foreground">All Pickup & Return Process History</h3>
            <div className="rounded-lg border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Timestamp</TableHead>
                      <TableHead className="font-semibold">Process Type</TableHead>
                      <TableHead className="font-semibold">Operator</TableHead>
                      <TableHead className="font-semibold">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{log.timestamp}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            Pickup
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{log.operator}</TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            {log.actualPickupDate && (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Actual Date:</span>
                                <span className="font-medium">{log.actualPickupDate}</span>
                              </div>
                            )}
                            {log.actualPickupTime && (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Actual Time:</span>
                                <span className="font-medium">{log.actualPickupTime}</span>
                              </div>
                            )}
                            {log.diffAmount && (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Diff Amount:</span>
                                <span className="font-semibold text-yellow-600">${log.diffAmount}</span>
                              </div>
                            )}
                            {log.depositReceived && (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Deposit:</span>
                                <span className="font-semibold text-green-600">${log.depositReceived}</span>
                              </div>
                            )}
                            {log.mileage && (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Mileage:</span>
                                <span className="font-medium">{log.mileage} km</span>
                              </div>
                            )}
                            {log.fuelLevel && (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Fuel:</span>
                                <span className="font-medium">{log.fuelLevel}</span>
                              </div>
                            )}
                            {log.instrumentPanelImages && (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Instrument Panel Images:</span>
                                {log.instrumentPanelImages.map((img, index) => (
                                  <Image
                                    key={index}
                                    src={img || "/placeholder.svg"}
                                    alt={`Panel ${index + 1}`}
                                    width={50}
                                    height={50}
                                    className="rounded-lg object-cover"
                                  />
                                ))}
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

        <DialogFooter className="flex gap-3 pt-4 border-t mt-4">
          <Button onClick={handleSave} className="h-10 flex-1 bg-[#2663EB] hover:bg-[#2663EB]/90">
            Save
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10 flex-1">
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
