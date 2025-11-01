"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Upload, X, ArrowLeft, ZoomIn } from "lucide-react"
import Image from "next/image"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { differenceInDays, differenceInHours } from "date-fns"

interface PRReturnFormProps {
  job: any
  onComplete: (data: any) => void
  onBack: () => void
}

const renameFile = (file: File, newName: string): File => {
  const extension = file.name.split(".").pop()
  return new File([file], `${newName}.${extension}`, { type: file.type })
}

const getCacheKey = (jobId: string) => `pr-return-${jobId}`

export function PRReturnForm({ job, onComplete, onBack }: PRReturnFormProps) {
  const [conditionImages, setConditionImages] = useState<string[]>([])
  const [panelImages, setPanelImages] = useState<string[]>([])
  const [mileage, setMileage] = useState("")
  const [fuelLevel, setFuelLevel] = useState("")
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [unplannedExtraPayment, setUnplannedExtraPayment] = useState("")

  const calculateLowFuelCharge = () => {
    if (!fuelLevel) return 0

    const pickupFuelLevel = Number.parseFloat(job.pickupFuelLevel || "1")
    const returnFuelLevel = Number.parseFloat(fuelLevel)

    if (returnFuelLevel < pickupFuelLevel) {
      const fuelDifference = pickupFuelLevel - returnFuelLevel
      // Base charge: RM 15 minimum, RM 20 per 1/8 tank difference
      const baseCharge = 15
      const additionalCharge = fuelDifference * 20
      return Math.max(baseCharge, additionalCharge)
    }
    return 0
  }

  // Calculate unplanned extra hours
  const calculateUnplannedExtra = () => {
    const actualPickup = new Date(job.actualStartDate || job.startDate)
    const plannedReturn = new Date(job.endDate)
    const now = new Date()

    const daysDiff = differenceInDays(now, plannedReturn)
    const hoursDiff = differenceInHours(now, plannedReturn) % 24

    if (daysDiff > 0 || hoursDiff > 0) {
      const extraCharge = daysDiff * 50 + hoursDiff * 5
      return { daysDiff, hoursDiff, extraCharge }
    }
    return null
  }

  const unplannedExtra = calculateUnplannedExtra()
  const lowFuelCharge = calculateLowFuelCharge()

  const collectedDeposit = Number.parseFloat(job.depositAmount || "0")
  const unplannedExtraCharge = unplannedExtra?.extraCharge || 0
  const actualReturningDeposit = collectedDeposit - unplannedExtraCharge - lowFuelCharge

  // Load cached data
  useEffect(() => {
    const cacheKey = getCacheKey(job.jobId)
    const cached = localStorage.getItem(cacheKey)

    if (cached) {
      try {
        const data = JSON.parse(cached)
        setConditionImages(data.conditionImages || [])
        setPanelImages(data.panelImages || [])
        setMileage(data.mileage || "")
        setFuelLevel(data.fuelLevel || "")
        setUnplannedExtraPayment(data.unplannedExtraPayment || "")
        console.log("[v0] Loaded cached return data for job:", job.jobId)
      } catch (error) {
        console.error("[v0] Error loading cached return data:", error)
      }
    }
  }, [job.jobId])

  // Save to cache
  useEffect(() => {
    const cacheKey = getCacheKey(job.jobId)
    const dataToCache = {
      conditionImages,
      panelImages,
      mileage,
      fuelLevel,
      unplannedExtraPayment,
    }
    localStorage.setItem(cacheKey, JSON.stringify(dataToCache))
  }, [job.jobId, conditionImages, panelImages, mileage, fuelLevel, unplannedExtraPayment])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "condition" | "panel") => {
    const files = e.target.files
    if (!files) return

    const prefix = type === "condition" ? "cond" : "ins"
    const startIndex = type === "condition" ? conditionImages.length : panelImages.length

    const newImages: string[] = []
    Array.from(files).forEach((file, index) => {
      const renamedFile = renameFile(file, `xq-${job.jobId}-${prefix}-${startIndex + index + 1}`)
      console.log("[v0] Renamed file:", renamedFile.name)

      const reader = new FileReader()
      reader.onloadend = () => {
        newImages.push(reader.result as string)
        if (newImages.length === files.length) {
          if (type === "condition") setConditionImages([...conditionImages, ...newImages])
          if (type === "panel") setPanelImages([...panelImages, ...newImages])
        }
      }
      reader.readAsDataURL(renamedFile)
    })
  }

  const removeImage = (index: number, type: "condition" | "panel") => {
    if (type === "condition") setConditionImages(conditionImages.filter((_, i) => i !== index))
    if (type === "panel") setPanelImages(panelImages.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
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
    if (unplannedExtra && unplannedExtra.extraCharge > 0) {
      if (!unplannedExtraPayment.trim()) {
        alert("Unplanned extra hour payment is required")
        return
      }
      const paymentAmount = Number.parseFloat(unplannedExtraPayment)
      if (paymentAmount !== unplannedExtra.extraCharge) {
        alert(`Payment collected ($${paymentAmount}) must match the extra charge ($${unplannedExtra.extraCharge})`)
        return
      }
    }

    const data = {
      conditionImages,
      panelImages,
      mileage,
      fuelLevel,
      unplannedExtra,
      unplannedExtraPayment,
      collectedDeposit,
      lowFuelCharge,
      actualReturningDeposit,
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
          <h2 className="text-xl font-bold text-gray-900">Return Process</h2>
          <p className="text-sm text-muted-foreground">
            {job.jobId} • {job.carName} • {job.customerName}
          </p>
        </div>

        <div className="space-y-4">
          {/* Car Agreement ID (Read-only) */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Car Agreement ID</Label>
            <div className="h-11 px-3 py-2 bg-muted rounded-md border flex items-center">
              <span className="font-mono font-semibold text-gray-900">{job.carAgreementId || "AGR-2025-001"}</span>
            </div>
          </div>

          {/* Actual Pickup Date/Time */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Label className="text-sm font-semibold text-blue-900">Pickup Information</Label>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Actual Pickup:</span>
                <span className="font-medium">
                  {new Date(job.actualStartDate || job.startDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  | {job.actualStartTime || job.startTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Planned Return:</span>
                <span className="font-medium">
                  {new Date(job.endDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  | {job.endTime}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-blue-300">
                <span className="text-blue-700">Pickup Fuel Level:</span>
                <span className="font-medium">{job.pickupFuelLevel || "1"} (Full)</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <Label className="text-sm font-semibold text-green-900 mb-3">Deposit Return Calculation</Label>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">Collected Deposit:</span>
                <span className="font-semibold">RM {collectedDeposit.toFixed(2)}</span>
              </div>

              {unplannedExtraCharge > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Less: Unplanned Extra Hour</span>
                  <span className="font-semibold">- RM {unplannedExtraCharge.toFixed(2)}</span>
                </div>
              )}

              {lowFuelCharge > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Less: Low Fuel Charge</span>
                  <span className="font-semibold">- RM {lowFuelCharge.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between pt-2 border-t border-green-300">
                <span className="text-green-900 font-bold">Actual Returning Deposit:</span>
                <span className="font-bold text-lg text-green-900">RM {actualReturningDeposit.toFixed(2)}</span>
              </div>

              {lowFuelCharge > 0 && (
                <p className="text-xs text-orange-600 pt-1">
                  ⚠️ Fuel level is lower than pickup. Low fuel charge applied.
                </p>
              )}
            </div>
          </div>

          {/* Unplanned Extra Hour */}
          {unplannedExtra && unplannedExtra.extraCharge > 0 && (
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <Label className="text-sm font-semibold text-orange-900">⚠️ Unplanned Extra Hour Detected</Label>
              <div className="mt-3 space-y-2 text-sm">
                <div className="p-3 bg-white rounded border border-orange-300">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-orange-700">Extra Days:</span>
                      <span className="font-bold">{unplannedExtra.daysDiff} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-700">Extra Hours:</span>
                      <span className="font-bold">{unplannedExtra.hoursDiff} hours</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-orange-300">
                      <span className="text-orange-900 font-semibold">Total Extra Charge:</span>
                      <span className="font-bold text-lg text-orange-900">RM {unplannedExtra.extraCharge}</span>
                    </div>
                    <p className="text-xs text-orange-600 pt-1">(RM 50/day + RM 5/hour)</p>
                  </div>
                </div>

                <div className="mt-3">
                  <Label htmlFor="unplannedPayment" className="text-xs text-orange-700">
                    Amount Collected <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="unplannedPayment"
                    type="number"
                    step="0.01"
                    value={unplannedExtraPayment}
                    onChange={(e) => setUnplannedExtraPayment(e.target.value)}
                    placeholder="Enter collected amount"
                    className="h-11 mt-1"
                  />
                  <p className="text-xs text-orange-600 mt-1">
                    Must match extra charge: RM {unplannedExtra.extraCharge}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Car Condition Photos (Optional) */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Car Condition Photos (Optional)</Label>
            <p className="text-xs text-muted-foreground">Document any damages or issues</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("condition-upload")?.click()}
              className="w-full h-11"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Condition Photos
            </Button>
            <input
              id="condition-upload"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImageUpload(e, "condition")}
            />
            {conditionImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {conditionImages.map((img, index) => (
                  <div key={index} className="relative group">
                    <Image
                      src={img || "/placeholder.svg"}
                      alt={`Condition ${index + 1}`}
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
                        removeImage(index, "condition")
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

          {/* Instrument Panel Photos */}
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
            {fuelLevel && Number.parseFloat(fuelLevel) < Number.parseFloat(job.pickupFuelLevel || "1") && (
              <p className="text-xs text-orange-600 font-semibold">
                ⚠️ Fuel level is lower than pickup. Low fuel charge: RM {lowFuelCharge.toFixed(2)}
              </p>
            )}
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
