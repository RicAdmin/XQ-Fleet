"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Upload, X, ArrowLeft, ZoomIn } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Dialog, DialogContent } from "@/components/ui/dialog"

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

interface PRPickupFormProps {
  job: any
  onComplete: (data: any) => void
  onBack: () => void
}

// Helper function to rename files
const renameFile = (file: File, newName: string): File => {
  const extension = file.name.split(".").pop()
  return new File([file], `${newName}.${extension}`, { type: file.type })
}

// Cache key generator
const getCacheKey = (jobId: string) => `pr-pickup-${jobId}`

export function PRPickupForm({ job, onComplete, onBack }: PRPickupFormProps) {
  const [carAgreementId, setCarAgreementId] = useState("")
  const [agreementImages, setAgreementImages] = useState<string[]>([])
  const [documentImages, setDocumentImages] = useState<string[]>([])
  const [panelImages, setPanelImages] = useState<string[]>([])
  const [mileage, setMileage] = useState("")
  const [fuelLevel, setFuelLevel] = useState("")
  const [extraHourDate, setExtraHourDate] = useState<Date>()
  const [extraHourTime, setExtraHourTime] = useState("")
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    const cacheKey = getCacheKey(job.jobId)
    const cached = localStorage.getItem(cacheKey)

    if (cached) {
      try {
        const data = JSON.parse(cached)
        setCarAgreementId(data.carAgreementId || "")
        setAgreementImages(data.agreementImages || [])
        setDocumentImages(data.documentImages || [])
        setPanelImages(data.panelImages || [])
        setMileage(data.mileage || "")
        setFuelLevel(data.fuelLevel || "")
        if (data.extraHourDate) setExtraHourDate(new Date(data.extraHourDate))
        setExtraHourTime(data.extraHourTime || "")
        console.log("[v0] Loaded cached data for job:", job.jobId)
      } catch (error) {
        console.error("[v0] Error loading cached data:", error)
      }
    }
  }, [job.jobId])

  useEffect(() => {
    const cacheKey = getCacheKey(job.jobId)
    const dataToCache = {
      carAgreementId,
      agreementImages,
      documentImages,
      panelImages,
      mileage,
      fuelLevel,
      extraHourDate: extraHourDate?.toISOString(),
      extraHourTime,
    }
    localStorage.setItem(cacheKey, JSON.stringify(dataToCache))
  }, [
    job.jobId,
    carAgreementId,
    agreementImages,
    documentImages,
    panelImages,
    mileage,
    fuelLevel,
    extraHourDate,
    extraHourTime,
  ])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "agreement" | "document" | "panel") => {
    const files = e.target.files
    if (!files) return

    const prefix = type === "agreement" ? "agr" : type === "document" ? "doc" : "ins"
    const startIndex =
      type === "agreement" ? agreementImages.length : type === "document" ? documentImages.length : panelImages.length

    const newImages: string[] = []
    Array.from(files).forEach((file, index) => {
      const renamedFile = renameFile(file, `xq-${job.jobId}-${prefix}-${startIndex + index + 1}`)
      console.log("[v0] Renamed file:", renamedFile.name)

      const reader = new FileReader()
      reader.onloadend = () => {
        newImages.push(reader.result as string)
        if (newImages.length === files.length) {
          if (type === "agreement") setAgreementImages([...agreementImages, ...newImages])
          if (type === "document") setDocumentImages([...documentImages, ...newImages])
          if (type === "panel") setPanelImages([...panelImages, ...newImages])
        }
      }
      reader.readAsDataURL(renamedFile)
    })
  }

  const removeImage = (index: number, type: "agreement" | "document" | "panel") => {
    if (type === "agreement") setAgreementImages(agreementImages.filter((_, i) => i !== index))
    if (type === "document") setDocumentImages(documentImages.filter((_, i) => i !== index))
    if (type === "panel") setPanelImages(panelImages.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (!carAgreementId.trim()) {
      alert("Car Agreement ID is required")
      return
    }
    if (agreementImages.length === 0) {
      alert("Car Agreement photos are required")
      return
    }
    if (documentImages.length === 0) {
      alert("Customer Document photos are required")
      return
    }
    if (panelImages.length === 0) {
      alert("Instrument Panel photos are required")
      return
    }
    if (!mileage.trim()) {
      alert("Mileage is required")
      return
    }
    if (!fuelLevel) {
      alert("Fuel Level is required")
      return
    }

    const data = {
      carAgreementId,
      agreementImages,
      documentImages,
      panelImages,
      mileage,
      fuelLevel,
      extraHourDate,
      extraHourTime,
    }

    onComplete(data)
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Search
      </Button>

      <Card className="p-4">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">{job.jobId}</h2>
          <p className="text-sm text-muted-foreground">
            {job.carName} • {job.customerName}
          </p>
        </div>

        <div className="space-y-4">
          {/* Car Agreement ID */}
          <div className="space-y-2">
            <Label htmlFor="agreementId" className="text-sm font-semibold">
              Car Agreement ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="agreementId"
              value={carAgreementId}
              onChange={(e) => setCarAgreementId(e.target.value)}
              placeholder="Enter agreement ID"
              className="h-11"
            />
          </div>

          {/* Car Agreement Photos */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Car Agreement Photos <span className="text-red-500">*</span>
            </Label>
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("agreement-upload")?.click()}
              className="w-full h-11"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Agreement Photos
            </Button>
            <input
              id="agreement-upload"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImageUpload(e, "agreement")}
            />
            {agreementImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {agreementImages.map((img, index) => (
                  <div key={index} className="relative group">
                    <Image
                      src={img || "/placeholder.svg"}
                      alt={`Agreement ${index + 1}`}
                      width={100}
                      height={100}
                      className="rounded-lg object-cover w-full h-24 cursor-pointer"
                      onClick={() => setPreviewImage(img)}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <ZoomIn className="h-6 w-6 text-white" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeImage(index, "agreement")
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer Documents */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Customer Documents <span className="text-red-500">*</span>
            </Label>
            <p className="text-xs text-muted-foreground">Passport, International License, Driving License</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("document-upload")?.click()}
              className="w-full h-11"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Document Photos
            </Button>
            <input
              id="document-upload"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImageUpload(e, "document")}
            />
            {documentImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {documentImages.map((img, index) => (
                  <div key={index} className="relative group">
                    <Image
                      src={img || "/placeholder.svg"}
                      alt={`Document ${index + 1}`}
                      width={100}
                      height={100}
                      className="rounded-lg object-cover w-full h-24 cursor-pointer"
                      onClick={() => setPreviewImage(img)}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <ZoomIn className="h-6 w-6 text-white" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeImage(index, "document")
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instrument Panel */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Instrument Panel Photos <span className="text-red-500">*</span>
            </Label>
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("panel-upload")?.click()}
              className="w-full h-11"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Panel Photos
            </Button>
            <input
              id="panel-upload"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImageUpload(e, "panel")}
            />
            {panelImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {panelImages.map((img, index) => (
                  <div key={index} className="relative group">
                    <Image
                      src={img || "/placeholder.svg"}
                      alt={`Panel ${index + 1}`}
                      width={100}
                      height={100}
                      className="rounded-lg object-cover w-full h-24 cursor-pointer"
                      onClick={() => setPreviewImage(img)}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <ZoomIn className="h-6 w-6 text-white" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeImage(index, "panel")
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mileage */}
          <div className="space-y-2">
            <Label htmlFor="mileage" className="text-sm font-semibold">
              Mileage (km) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="mileage"
              type="number"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              placeholder="Enter current mileage"
              className="h-11"
            />
          </div>

          {/* Fuel Level */}
          <div className="space-y-2">
            <Label htmlFor="fuelLevel" className="text-sm font-semibold">
              Fuel Level <span className="text-red-500">*</span>
            </Label>
            <select
              id="fuelLevel"
              value={fuelLevel}
              onChange={(e) => setFuelLevel(e.target.value)}
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
          </div>

          {/* Extra Hour (Optional) */}
          <div className="space-y-2 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <Label className="text-sm font-semibold text-yellow-900">Extra Hour (Optional)</Label>
            <p className="text-xs text-yellow-700 mb-2">If car will be returned later than planned</p>

            <div className="mb-3 p-2 bg-white rounded border border-yellow-300">
              <p className="text-xs font-medium text-yellow-900">Original Return Date | Time:</p>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(job.endDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}{" "}
                | {job.endTime}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">New Return Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-10",
                        !extraHourDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {extraHourDate ? format(extraHourDate, "PPP") : <span>Pick date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={extraHourDate} onSelect={setExtraHourDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">New Return Time</Label>
                <select
                  value={extraHourTime}
                  onChange={(e) => setExtraHourTime(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
          </div>

          <Button onClick={handleSubmit} className="w-full h-12 text-base font-semibold mt-6">
            Continue
          </Button>
        </div>
      </Card>

      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl">
          <div className="relative w-full h-[80vh]">
            {previewImage && (
              <Image src={previewImage || "/placeholder.svg"} alt="Preview" fill className="object-contain" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
