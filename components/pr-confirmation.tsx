"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, ArrowLeft, ZoomIn } from "lucide-react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import QRCode from "react-qr-code"
import Image from "next/image"
import { differenceInDays, differenceInHours } from "date-fns"

interface PRConfirmationProps {
  job: any
  pickupData: any
  onConfirm: () => void
  onBack: () => void
}

export function PRConfirmation({ job, pickupData, onConfirm, onBack }: PRConfirmationProps) {
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const handleConfirmClick = () => {
    setShowConfirmDialog(true)
  }

  const handleFinalConfirm = () => {
    const qrUrl = `${window.location.origin}/pr/customer?jobId=${job.jobId}&mobile=${encodeURIComponent(job.customerMobile)}`
    setQrCodeUrl(qrUrl)
    setIsConfirmed(true)
    setShowConfirmDialog(false)

    const cacheKey = `pr-pickup-${job.jobId}`
    localStorage.removeItem(cacheKey)
    console.log("[v0] Cleared cache for job:", job.jobId)
    console.log("[v0] Pickup confirmed for job:", job.jobId)
  }

  const calculateExtraCharge = () => {
    if (!pickupData.extraHourDate || !pickupData.extraHourTime) return null

    const originalReturn = new Date(job.endDate)
    const newReturn = new Date(pickupData.extraHourDate)

    const daysDiff = differenceInDays(newReturn, originalReturn)
    const hoursDiff = differenceInHours(newReturn, originalReturn) % 24

    // Calculate fee: $50 per day + $5 per hour
    const extraCharge = daysDiff * 50 + hoursDiff * 5

    return { daysDiff, hoursDiff, extraCharge }
  }

  const extraChargeInfo = calculateExtraCharge()

  if (isConfirmed) {
    return (
      <div className="space-y-4">
        <Card className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Pickup Confirmed!</h2>
            <p className="text-sm text-muted-foreground">Job {job.jobId} has been marked as picked up</p>
          </div>

          <div className="bg-white p-6 rounded-lg border-2 border-green-500 mb-6">
            <h3 className="font-semibold text-center mb-4 text-gray-900">Customer P&R QR Code</h3>
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-white rounded-lg shadow-lg">
                <QRCode value={qrCodeUrl} size={220} />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-gray-900">Scan this QR code to access P&R details</p>
              <p className="text-xs text-muted-foreground">Job ID: {job.jobId}</p>
              <p className="text-xs text-muted-foreground">Mobile: {job.customerMobile}</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-sm text-green-900 mb-3">Confirmed Pickup Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Customer:</span>
                  <span className="font-medium">{job.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Car:</span>
                  <span className="font-medium">{job.carName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Agreement ID:</span>
                  <span className="font-mono font-semibold">{pickupData.carAgreementId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Mileage:</span>
                  <span className="font-medium">{pickupData.mileage} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Fuel Level:</span>
                  <span className="font-medium">{pickupData.fuelLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Pickup Date:</span>
                  <span className="font-medium">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Pickup Time:</span>
                  <span className="font-medium">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>

            {extraChargeInfo && (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h3 className="font-semibold text-sm text-yellow-900 mb-3">Extended Return Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-yellow-700">New Return Date:</span>
                    <span className="font-medium">
                      {pickupData.extraHourDate
                        ? new Date(pickupData.extraHourDate).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-700">New Return Time:</span>
                    <span className="font-medium">{pickupData.extraHourTime}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-yellow-300">
                    <span className="text-yellow-900 font-semibold">Extra Fee:</span>
                    <span className="font-bold text-yellow-900">${extraChargeInfo.extraCharge}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button onClick={onConfirm} className="w-full h-12 bg-green-600 hover:bg-green-700">
            Done
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Edit
      </Button>

      <Card className="p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pickup Confirmation</h2>
          <p className="text-sm text-muted-foreground">Review details before confirming</p>
        </div>

        <div className="space-y-4">
          {/* Job Details */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <h3 className="font-semibold text-sm mb-3">Job Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Job ID:</span>
                <span className="font-mono font-semibold">{job.jobId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-medium">{job.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Car:</span>
                <span className="font-medium">{job.carName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Agreement ID:</span>
                <span className="font-mono font-semibold">{pickupData.carAgreementId}</span>
              </div>
            </div>
          </div>

          {/* Vehicle Condition */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <h3 className="font-semibold text-sm mb-3">Vehicle Condition</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mileage:</span>
                <span className="font-medium">{pickupData.mileage} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fuel Level:</span>
                <span className="font-medium">{pickupData.fuelLevel || "Not specified"}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted/30 rounded-lg">
            <h3 className="font-semibold text-sm mb-3">Photos Uploaded (Click to view)</h3>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Agreement Photos ({pickupData.agreementImages.length})
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {pickupData.agreementImages.map((img: string, index: number) => (
                    <div key={index} className="relative group cursor-pointer" onClick={() => setPreviewImage(img)}>
                      <Image
                        src={img || "/placeholder.svg"}
                        alt={`Agreement ${index + 1}`}
                        width={80}
                        height={80}
                        className="rounded object-cover w-full h-16"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                        <ZoomIn className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Document Photos ({pickupData.documentImages.length})
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {pickupData.documentImages.map((img: string, index: number) => (
                    <div key={index} className="relative group cursor-pointer" onClick={() => setPreviewImage(img)}>
                      <Image
                        src={img || "/placeholder.svg"}
                        alt={`Document ${index + 1}`}
                        width={80}
                        height={80}
                        className="rounded object-cover w-full h-16"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                        <ZoomIn className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Panel Photos ({pickupData.panelImages.length})</p>
                <div className="grid grid-cols-4 gap-2">
                  {pickupData.panelImages.map((img: string, index: number) => (
                    <div key={index} className="relative group cursor-pointer" onClick={() => setPreviewImage(img)}>
                      <Image
                        src={img || "/placeholder.svg"}
                        alt={`Panel ${index + 1}`}
                        width={80}
                        height={80}
                        className="rounded object-cover w-full h-16"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                        <ZoomIn className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {extraChargeInfo && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h3 className="font-semibold text-sm text-yellow-900 mb-3">Extra Hour Charges</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-yellow-700">Original Return:</span>
                  <span className="font-medium">
                    {new Date(job.endDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    | {job.endTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-700">New Return:</span>
                  <span className="font-medium">
                    {pickupData.extraHourDate
                      ? new Date(pickupData.extraHourDate).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "N/A"}{" "}
                    | {pickupData.extraHourTime}
                  </span>
                </div>
                <div className="pt-2 border-t border-yellow-300 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-yellow-900 font-semibold">Extra Days:</span>
                    <span className="font-bold">{extraChargeInfo.daysDiff} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-900 font-semibold">Extra Hours:</span>
                    <span className="font-bold">{extraChargeInfo.hoursDiff} hours</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-yellow-300">
                    <span className="text-yellow-900 font-semibold">Extra Fee:</span>
                    <span className="font-bold text-lg text-yellow-900">${extraChargeInfo.extraCharge}</span>
                  </div>
                  <p className="text-xs text-yellow-700 pt-1">($50/day + $5/hour)</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <Button variant="outline" onClick={onBack} className="h-12 bg-transparent">
            Back
          </Button>
          <Button onClick={handleConfirmClick} className="h-12 bg-green-600 hover:bg-green-700">
            <Check className="h-5 w-5 mr-2" />
            Cfm. Pickup
          </Button>
        </div>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Pickup?</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this job as picked up? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              No, Cancel
            </Button>
            <Button onClick={handleFinalConfirm} className="bg-green-600 hover:bg-green-700">
              Yes, Confirm Pickup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
