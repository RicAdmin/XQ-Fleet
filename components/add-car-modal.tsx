"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, ImageIcon } from "lucide-react"

type CarStatus =
  | "Available 可用"
  | "Reserved 已预订"
  | "Rented 在租"
  | "Due Back 到期待还"
  | "Overdue 逾期未还"
  | "Returned 已归还"
  | "Cleaning 清洁中"
  | "Inspection 质检中"
  | "Maintenance 维修中"
  | "Off Fleet 暂离车队"

type CarCategory = "Sedan" | "MPV" | "SUV"
type Transmission = "Auto" | "Manual"
type FuelType = "Gasoline" | "Diesel"
type FuelGaugeType = "Analog needle" | "Digital bars" | "Percentage on dash" | "Distance to empty on dash"

interface Car {
  registrationNo: string
  make: string
  model: string
  category: CarCategory
  status: CarStatus
  dailyRate: number
  photo: string
  joinFleetDate: string
  doors: number
  passengers: number
  color: string
  transmission: Transmission
  fuelType: FuelType
  fuelGaugeType: FuelGaugeType
  fuelValue: string | { barsLit: number; barsTotal: number }
  largeLuggage: number
  cabinLuggage: number
  mileageKm: number
  lastServiceDate: string
  extraHourFeeLow: number
  extraHourFeePeak: number
  hasGPS: boolean
  provider: string
}

interface AddCarModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddCar: (car: Car) => void
}

export function AddCarModal({ open, onOpenChange, onAddCar }: AddCarModalProps) {
  const [formData, setFormData] = useState<Car>({
    registrationNo: "",
    make: "",
    model: "",
    category: "Sedan",
    status: "Available 可用",
    dailyRate: 0,
    photo: "/classic-red-convertible.png",
    joinFleetDate: new Date().toISOString().split("T")[0],
    doors: 4,
    passengers: 5,
    color: "",
    transmission: "Auto",
    fuelType: "Gasoline",
    fuelGaugeType: "Analog needle",
    fuelValue: "1",
    largeLuggage: 0,
    cabinLuggage: 0,
    mileageKm: 0,
    lastServiceDate: new Date().toISOString().split("T")[0],
    extraHourFeeLow: 0,
    extraHourFeePeak: 0,
    hasGPS: false,
    provider: "XQ",
  })

  const [imagePreview, setImagePreview] = useState<string>("")
  const [customProvider, setCustomProvider] = useState<string>("")
  const [showCustomProvider, setShowCustomProvider] = useState<boolean>(false)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
        setFormData({ ...formData, photo: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const finalData = {
      ...formData,
      provider: showCustomProvider ? customProvider : formData.provider,
    }
    onAddCar(finalData)
    onOpenChange(false)
    setFormData({
      registrationNo: "",
      make: "",
      model: "",
      category: "Sedan",
      status: "Available 可用",
      dailyRate: 0,
      photo: "/classic-red-convertible.png",
      joinFleetDate: new Date().toISOString().split("T")[0],
      doors: 4,
      passengers: 5,
      color: "",
      transmission: "Auto",
      fuelType: "Gasoline",
      fuelGaugeType: "Analog needle",
      fuelValue: "1",
      largeLuggage: 0,
      cabinLuggage: 0,
      mileageKm: 0,
      lastServiceDate: new Date().toISOString().split("T")[0],
      extraHourFeeLow: 0,
      extraHourFeePeak: 0,
      hasGPS: false,
      provider: "XQ",
    })
    setImagePreview("")
    setCustomProvider("")
    setShowCustomProvider(false)
  }

  const renderFuelValueInput = () => {
    switch (formData.fuelGaugeType) {
      case "Analog needle":
        return (
          <Select
            value={typeof formData.fuelValue === "string" ? formData.fuelValue : "1"}
            onValueChange={(value) => setFormData({ ...formData, fuelValue: value })}
          >
            <SelectTrigger id="fuelValue" className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Empty (0)</SelectItem>
              <SelectItem value="0.125">1/8</SelectItem>
              <SelectItem value="0.25">1/4</SelectItem>
              <SelectItem value="0.375">3/8</SelectItem>
              <SelectItem value="0.5">1/2</SelectItem>
              <SelectItem value="0.625">5/8</SelectItem>
              <SelectItem value="0.75">3/4</SelectItem>
              <SelectItem value="0.875">7/8</SelectItem>
              <SelectItem value="1">Full (1)</SelectItem>
            </SelectContent>
          </Select>
        )
      case "Digital bars":
        return (
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-2">
              <Label htmlFor="barsLit" className="text-xs">
                Bars Lit
              </Label>
              <Input
                id="barsLit"
                type="number"
                min="0"
                placeholder="8"
                value={typeof formData.fuelValue === "object" ? formData.fuelValue.barsLit : 8}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    fuelValue: {
                      barsLit: Number.parseInt(e.target.value) || 0,
                      barsTotal: typeof formData.fuelValue === "object" ? formData.fuelValue.barsTotal : 10,
                    },
                  })
                }
                className="bg-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="barsTotal" className="text-xs">
                Bars Total
              </Label>
              <Input
                id="barsTotal"
                type="number"
                min="1"
                placeholder="10"
                value={typeof formData.fuelValue === "object" ? formData.fuelValue.barsTotal : 10}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    fuelValue: {
                      barsLit: typeof formData.fuelValue === "object" ? formData.fuelValue.barsLit : 8,
                      barsTotal: Number.parseInt(e.target.value) || 10,
                    },
                  })
                }
                className="bg-white"
              />
            </div>
          </div>
        )
      case "Percentage on dash":
        return (
          <Input
            id="fuelValue"
            type="number"
            min="0"
            max="100"
            placeholder="75"
            value={typeof formData.fuelValue === "string" ? formData.fuelValue : "75"}
            onChange={(e) => setFormData({ ...formData, fuelValue: e.target.value })}
            className="bg-white"
          />
        )
      case "Distance to empty on dash":
        return (
          <Input
            id="fuelValue"
            type="number"
            min="0"
            placeholder="350"
            value={typeof formData.fuelValue === "string" ? formData.fuelValue : "350"}
            onChange={(e) => setFormData({ ...formData, fuelValue: e.target.value })}
            className="bg-white"
          />
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Add New Car</DialogTitle>
          <DialogDescription>Enter the details of the new vehicle to add to your fleet.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            <div className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-200">
              <Label className="text-sm font-medium">Car Image</Label>
              <div className="flex items-center gap-4">
                <div className="w-40 h-[87px] rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-white">
                  {imagePreview ? (
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <input type="file" id="carImage" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("carImage")?.click()}
                    className="w-full bg-white hover:bg-gray-50"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Car Image
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">Recommended: 756 × 412px, PNG or JPG</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl space-y-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Basic Information</h3>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="registrationNo">Car Plate (Registration No.) - Optional</Label>
                  <Input
                    id="registrationNo"
                    placeholder="ABC-1234"
                    value={formData.registrationNo}
                    onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value })}
                    className="bg-white"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="make">Car Brand *</Label>
                  <Input
                    id="make"
                    placeholder="Toyota, Honda, etc."
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    required
                    className="bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="model">Model *</Label>
                    <Input
                      id="model"
                      placeholder="Camry, Civic, etc."
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      required
                      className="bg-white"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="joinFleetDate">Join Fleet Date *</Label>
                    <Input
                      id="joinFleetDate"
                      type="date"
                      value={formData.joinFleetDate}
                      onChange={(e) => setFormData({ ...formData, joinFleetDate: e.target.value })}
                      required
                      className="bg-white"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="provider">Provider *</Label>
                  <Select
                    value={showCustomProvider ? "Other" : formData.provider}
                    onValueChange={(value) => {
                      if (value === "Other") {
                        setShowCustomProvider(true)
                      } else {
                        setShowCustomProvider(false)
                        setFormData({ ...formData, provider: value })
                      }
                    }}
                  >
                    <SelectTrigger id="provider" className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XQ">XQ</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {showCustomProvider && (
                    <Input
                      placeholder="Enter provider name"
                      value={customProvider}
                      onChange={(e) => setCustomProvider(e.target.value)}
                      required
                      className="bg-white mt-2"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl space-y-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Vehicle Specifications</h3>

              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: CarCategory) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger id="category" className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sedan">Sedan</SelectItem>
                        <SelectItem value="MPV">MPV</SelectItem>
                        <SelectItem value="SUV">SUV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="color">Car Color *</Label>
                    <Input
                      id="color"
                      placeholder="White, Black, Silver, etc."
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      required
                      className="bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="doors">Number of Doors *</Label>
                    <Select
                      value={formData.doors.toString()}
                      onValueChange={(value) => setFormData({ ...formData, doors: Number.parseInt(value) })}
                    >
                      <SelectTrigger id="doors" className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 Doors</SelectItem>
                        <SelectItem value="4">4 Doors</SelectItem>
                        <SelectItem value="5">5 Doors</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="passengers">Passengers *</Label>
                    <Select
                      value={formData.passengers.toString()}
                      onValueChange={(value) => setFormData({ ...formData, passengers: Number.parseInt(value) })}
                    >
                      <SelectTrigger id="passengers" className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 Passengers</SelectItem>
                        <SelectItem value="4">4 Passengers</SelectItem>
                        <SelectItem value="5">5 Passengers</SelectItem>
                        <SelectItem value="7">7 Passengers</SelectItem>
                        <SelectItem value="8">8 Passengers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="transmission">Transmission *</Label>
                    <Select
                      value={formData.transmission}
                      onValueChange={(value: Transmission) => setFormData({ ...formData, transmission: value })}
                    >
                      <SelectTrigger id="transmission" className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Auto">Auto</SelectItem>
                        <SelectItem value="Manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fuelType">Fuel Type *</Label>
                    <Select
                      value={formData.fuelType}
                      onValueChange={(value: FuelType) => setFormData({ ...formData, fuelType: value })}
                    >
                      <SelectTrigger id="fuelType" className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Gasoline">Gasoline</SelectItem>
                        <SelectItem value="Diesel">Diesel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fuelGaugeType">Fuel Gauge Type *</Label>
                    <Select
                      value={formData.fuelGaugeType}
                      onValueChange={(value: FuelGaugeType) =>
                        setFormData({
                          ...formData,
                          fuelGaugeType: value,
                          fuelValue: value === "Digital bars" ? { barsLit: 8, barsTotal: 10 } : "1",
                        })
                      }
                    >
                      <SelectTrigger id="fuelGaugeType" className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Analog needle">Analog needle</SelectItem>
                        <SelectItem value="Digital bars">Digital bars</SelectItem>
                        <SelectItem value="Percentage on dash">Percentage on dash</SelectItem>
                        <SelectItem value="Distance to empty on dash">Distance to empty on dash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fuelValue">
                      Fuel Value *{formData.fuelGaugeType === "Percentage on dash" && " (%)"}
                      {formData.fuelGaugeType === "Distance to empty on dash" && " (km)"}
                    </Label>
                    {renderFuelValueInput()}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="largeLuggage">Large Luggage *</Label>
                    <Input
                      id="largeLuggage"
                      type="number"
                      min="0"
                      placeholder="2"
                      value={formData.largeLuggage || ""}
                      onChange={(e) => setFormData({ ...formData, largeLuggage: Number.parseInt(e.target.value) || 0 })}
                      required
                      className="bg-white"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cabinLuggage">Cabin Luggage *</Label>
                    <Input
                      id="cabinLuggage"
                      type="number"
                      min="0"
                      placeholder="2"
                      value={formData.cabinLuggage || ""}
                      onChange={(e) => setFormData({ ...formData, cabinLuggage: Number.parseInt(e.target.value) || 0 })}
                      required
                      className="bg-white"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="hasGPS">In-Car GPS *</Label>
                  <Select
                    value={formData.hasGPS ? "Yes" : "No"}
                    onValueChange={(value) => setFormData({ ...formData, hasGPS: value === "Yes" })}
                  >
                    <SelectTrigger id="hasGPS" className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl space-y-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Status & Maintenance</h3>

              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="status">Car Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: CarStatus) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger id="status" className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Available 可用">Available 可用</SelectItem>
                        <SelectItem value="Reserved 已预订">Reserved 已预订</SelectItem>
                        <SelectItem value="Rented 在租">Rented 在租</SelectItem>
                        <SelectItem value="Due Back 到期待还">Due Back 到期待还</SelectItem>
                        <SelectItem value="Overdue 逾期未还">Overdue 逾期未还</SelectItem>
                        <SelectItem value="Returned 已归还">Returned 已归还</SelectItem>
                        <SelectItem value="Cleaning 清洁中">Cleaning 清洁中</SelectItem>
                        <SelectItem value="Inspection 质检中">Inspection 质检中</SelectItem>
                        <SelectItem value="Maintenance 维修中">Maintenance 维修中</SelectItem>
                        <SelectItem value="Off Fleet 暂离车队">Off Fleet 暂离车队</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="mileageKm">Mileage (KM) *</Label>
                    <Input
                      id="mileageKm"
                      type="number"
                      min="0"
                      placeholder="50000"
                      value={formData.mileageKm || ""}
                      onChange={(e) => setFormData({ ...formData, mileageKm: Number.parseInt(e.target.value) || 0 })}
                      required
                      className="bg-white"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="lastServiceDate">Last Service Date *</Label>
                  <Input
                    id="lastServiceDate"
                    type="date"
                    value={formData.lastServiceDate}
                    onChange={(e) => setFormData({ ...formData, lastServiceDate: e.target.value })}
                    required
                    className="bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl space-y-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Pricing</h3>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dailyRate">Daily Rate (RM) *</Label>
                  <Input
                    id="dailyRate"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="150.00"
                    value={formData.dailyRate || ""}
                    onChange={(e) => setFormData({ ...formData, dailyRate: Number.parseFloat(e.target.value) || 0 })}
                    required
                    className="bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="extraHourFeeLow">Extra Hour Fee - Low (RM) *</Label>
                    <Input
                      id="extraHourFeeLow"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="10.00"
                      value={formData.extraHourFeeLow || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, extraHourFeeLow: Number.parseFloat(e.target.value) || 0 })
                      }
                      required
                      className="bg-white"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="extraHourFeePeak">Extra Hour Fee - Peak (RM) *</Label>
                    <Input
                      id="extraHourFeePeak"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="15.00"
                      value={formData.extraHourFeePeak || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, extraHourFeePeak: Number.parseFloat(e.target.value) || 0 })
                      }
                      required
                      className="bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="bg-white">
              Cancel
            </Button>
            <Button type="submit" className="bg-[#2663EB] hover:bg-[#1e4fc4]">
              Add Vehicle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
