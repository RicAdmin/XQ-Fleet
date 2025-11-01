"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Upload, X, ArrowLeft, ZoomIn, Calculator } from "lucide-react"
import Image from "next/image"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { differenceInDays, differenceInHours, format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

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

const getCurrentTimeFormatted = () => {
  const now = new Date()
  const hours = now.getHours()
  const ampm = hours >= 12 ? "PM" : "AM"
  const displayHours = hours % 12 || 12
  return `${displayHours}:00 ${ampm}`
}

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
  const [actualReturnDate, setActualReturnDate] = useState<Date>(new Date())
  const [actualReturnTime, setActualReturnTime] = useState(getCurrentTimeFormatted())
  const [conditionImages, setConditionImages] = useState<string[]>([])
  const [panelImages, setPanelImages] = useState<string[]>([])
  const [mileage, setMileage] = useState("")
  const [fuelLevel, setFuelLevel] = useState("")
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [unplannedExtraPayment, setUnplannedExtraPayment] = useState("")
  const [lowFuelChargeAmount, setLowFuelChargeAmount] = useState<string>("")
  const [calculatedDeposit, setCalculatedDeposit] = useState<number | null>(null)
  const [showDepositCalculation, setShowDepositCalculation] = useState(false)
  const [rentalExtraCharge, setRentalExtraCharge] = useState("")

  const calculateUnplannedExtra = () => {
    if (!actualReturnDate || !actualReturnTime) return null

    const plannedReturn = new Date(job.endDate)
    const actualReturn = new Date(actualReturnDate)

    const daysDiff = differenceInDays(actualReturn, plannedReturn)
    const hoursDiff = differenceInHours(actualReturn, plannedReturn) % 24

    if (daysDiff > 0 || hoursDiff > 0) {
      const extraCharge = daysDiff * 50 + hoursDiff * 5
      return { daysDiff, hoursDiff, extraCharge }
    }
    return null
  }

  const unplannedExtra = calculateUnplannedExtra()

  const handleCalculateDeposit = () => {
    if (!fuelLevel) {
      alert("Please select fuel level first")
      return
    }

    const lowFuelCharge = lowFuelChargeAmount ? Number.parseFloat(lowFuelChargeAmount) : 0
    const collectedDeposit = Number.parseFloat(job.depositAmount || "0")
    const unplannedExtraCharge = unplannedExtra?.extraCharge || 0
    const actualReturningDeposit = collectedDeposit - unplannedExtraCharge - lowFuelCharge

    setCalculatedDeposit(actualReturningDeposit)
    setShowDepositCalculation(true)
  }

  const handleSubmit = () => {
    if (!actualReturnDate) {
      alert("Actual Return Date is required")
      return
    }
    if (!actualReturnTime) {
      alert("Actual Return Time is required")
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
    if (!showDepositCalculation) {
      alert("Please calculate the returning deposit first")
      return
    }

    if (calculatedDeposit !== null && calculatedDeposit < 0) {
      if (!rentalExtraCharge.trim()) {
        alert("Rental Extra Charge collection is required when deposit is insufficient")
        return
      }
      const chargeAmount = Number.parseFloat(rentalExtraCharge)
      const requiredAmount = Math.abs(calculatedDeposit)
      if (chargeAmount !== requiredAmount) {
        alert(
          `Rental Extra Charge collected (RM ${chargeAmount}) must match required amount (RM ${requiredAmount.toFixed(2)})`,
        )
        return
      }
    }

    const lowFuelCharge = lowFuelChargeAmount ? Number.parseFloat(lowFuelChargeAmount) : 0

    const data = {
      actualReturnDate,
      actualReturnTime,
      conditionImages,
      panelImages,
      mileage,
      fuelLevel,
      unplannedExtra,
      unplannedExtraPayment,
      lowFuelChargeAmount: lowFuelCharge,
      actualReturningDeposit: calculatedDeposit,
      rentalExtraCharge: calculatedDeposit && calculatedDeposit < 0 ? rentalExtraCharge : null,
    }

    onComplete(data)
  }

  useEffect(() => {
    const cacheKey = getCacheKey(job.jobId)
    const cached = localStorage.getItem(cacheKey)

    if (cached) {
      try {
        const data = JSON.parse(cached)
        if (data.actualReturnDate) setActualReturnDate(new Date(data.actualReturnDate))
        else setActualReturnDate(new Date()) // Default to current date if no cache
        setActualReturnTime(data.actualReturnTime || getCurrentTimeFormatted())
        setConditionImages(data.conditionImages || [])
        setPanelImages(data.panelImages || [])
        setMileage(data.mileage || "")
        setFuelLevel(data.fuelLevel || "")
        setUnplannedExtraPayment(data.unplannedExtraPayment || "")
        setLowFuelChargeAmount(data.lowFuelChargeAmount || "")
        setRentalExtraCharge(data.rentalExtraCharge || "")
        console.log("[v0] Loaded cached return data for job:", job.jobId)
      } catch (error) {
        console.error("[v0] Error loading cached return data:", error)
      }
    }
  }, [job.jobId])

  useEffect(() => {
    const cacheKey = getCacheKey(job.jobId)
    const dataToCache = {
      actualReturnDate: actualReturnDate?.toISOString(),
      actualReturnTime,
      conditionImages,
      panelImages,
      mileage,
      fuelLevel,
      unplannedExtraPayment,
      lowFuelChargeAmount,
      rentalExtraCharge,
    }
    localStorage.setItem(cacheKey, JSON.stringify(dataToCache))
  }, [
    job.jobId,
    actualReturnDate,
    actualReturnTime,
    conditionImages,
    panelImages,
    mileage,
    fuelLevel,
    unplannedExtraPayment,
    lowFuelChargeAmount,
    rentalExtraCharge,
  ])

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
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Car Agreement ID</Label>
            <div className="h-11 px-3 py-2 bg-muted rounded-md border flex items-center">
              <span className="font-mono font-semibold text-gray-900">{job.carAgreementId || "AGR-2025-001"}</span>
            </div>
          </div>

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

          <div className="space-y-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div>
              <Label className="text-sm font-semibold text-purple-900">
                Actual Return Date & Time <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-purple-700 mt-1">Select the actual date and time of vehicle return</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-purple-700">Return Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-11 bg-white",
                        !actualReturnDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {actualReturnDate ? format(actualReturnDate, "PPP") : "Pick date"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={actualReturnDate}
                      onSelect={(date) => date && setActualReturnDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-purple-700">Return Time</Label>
                <select
                  value={actualReturnTime}
                  onChange={(e) => setActualReturnTime(e.target.value)}
                  className="flex h-11 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
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

          <div className="space-y-2">
            <Label htmlFor="fuelLevel" className="text-sm font-semibold">
              Fuel Level <span className="text-red-500">*</span>
            </Label>
            <select
              id="fuelLevel"
              value={fuelLevel}
              onChange={(e) => {
                setFuelLevel(e.target.value)
                setShowDepositCalculation(false)
                setCalculatedDeposit(null)
              }}
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
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 mt-2 space-y-3">
                <div className="flex items-start space-x-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-900">⚠️ Low Fuel Level Detected</p>
                    <p className="text-xs text-orange-700 mt-1">
                      Fuel level ({fuelLevel}) is lower than pickup level ({job.pickupFuelLevel || "1"}).
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="lowFuelCharge" className="text-xs text-orange-700">
                    Low Fuel Surcharge (Optional)
                  </Label>
                  <select
                    id="lowFuelCharge"
                    value={lowFuelChargeAmount}
                    onChange={(e) => {
                      setLowFuelChargeAmount(e.target.value)
                      setShowDepositCalculation(false)
                      setCalculatedDeposit(null)
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                  >
                    <option value="">No charge</option>
                    <option value="10">RM 10</option>
                    <option value="15">RM 15</option>
                    <option value="20">RM 20</option>
                    <option value="30">RM 30</option>
                    <option value="50">RM 50</option>
                  </select>
                  {lowFuelChargeAmount && (
                    <p className="text-xs text-orange-600 mt-1">
                      ✓ Low fuel surcharge of RM {lowFuelChargeAmount} will be applied
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handleCalculateDeposit}
            variant="outline"
            className="w-full h-12 text-base font-semibold border-2 border-green-600 text-green-700 hover:bg-green-50 bg-transparent"
          >
            <Calculator className="h-5 w-5 mr-2" />
            Calculate Returning Deposit
          </Button>

          {showDepositCalculation && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200 space-y-3">
              <Label className="text-sm font-semibold text-green-900">Deposit Return Calculation</Label>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2">
                  <span className="text-green-700">Collected Deposit:</span>
                  <span className="font-semibold">RM {Number.parseFloat(job.depositAmount || "0").toFixed(2)}</span>
                </div>

                {unplannedExtra && unplannedExtra.extraCharge > 0 && (
                  <div className="border-t border-green-200 pt-2">
                    <div className="flex justify-between text-red-600 mb-1">
                      <span className="font-medium">Less: Extra Hours</span>
                      <span className="font-semibold">- RM {unplannedExtra.extraCharge.toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-red-500 pl-4 space-y-0.5">
                      <div>
                        • Extra {unplannedExtra.daysDiff} day(s) × RM 50 = RM{" "}
                        {(unplannedExtra.daysDiff * 50).toFixed(2)}
                      </div>
                      <div>
                        • Extra {unplannedExtra.hoursDiff} hour(s) × RM 5 = RM{" "}
                        {(unplannedExtra.hoursDiff * 5).toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}

                {lowFuelChargeAmount && Number.parseFloat(lowFuelChargeAmount) > 0 && (
                  <div className="flex justify-between text-red-600 border-t border-green-200 pt-2">
                    <span>Less: Low Fuel Surcharge</span>
                    <span className="font-semibold">- RM {Number.parseFloat(lowFuelChargeAmount).toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between pt-3 border-t-2 border-green-300">
                  <span className="text-green-900 font-bold">Actual Returning Deposit will be:</span>
                  <span
                    className={cn(
                      "font-bold text-lg",
                      calculatedDeposit !== null && calculatedDeposit < 0 ? "text-red-600" : "text-green-900",
                    )}
                  >
                    RM {calculatedDeposit?.toFixed(2)}
                  </span>
                </div>

                {calculatedDeposit !== null && calculatedDeposit < 0 && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 mt-3">
                    <p className="text-sm font-semibold text-red-900 mb-2">⚠️ Customer owes additional payment</p>
                    <div className="space-y-2">
                      <Label htmlFor="rentalExtraCharge" className="text-xs text-red-700">
                        Rental Extra Charge Collected <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="rentalExtraCharge"
                        type="number"
                        step="0.01"
                        value={rentalExtraCharge}
                        onChange={(e) => setRentalExtraCharge(e.target.value)}
                        placeholder="Enter collected amount"
                        className="h-10"
                      />
                      <p className="text-xs text-red-600">Must collect: RM {Math.abs(calculatedDeposit).toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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
                    <p className="text-xs text-orange-600 mt-1">(RM 50/day + RM 5/hour)</p>
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
