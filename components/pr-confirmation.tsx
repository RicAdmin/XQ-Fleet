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
  confirmationType?: "pickup" | "return"
  isViewOnly?: boolean
}

export function PRConfirmation({
  job,
  pickupData,
  onConfirm,
  onBack,
  confirmationType = "pickup",
  isViewOnly = false,
}: PRConfirmationProps) {
  const [isConfirmed, setIsConfirmed] = useState(isViewOnly)
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

    const cacheKey = confirmationType === "pickup" ? `pr-pickup-${job.jobId}` : `pr-return-${job.jobId}`
    localStorage.removeItem(cacheKey)
    console.log("[v0] Cleared cache for job:", job.jobId)
    console.log(`[v0] ${confirmationType} confirmed for job:`, job.jobId)
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

  if (isConfirmed || isViewOnly) {
    return (
      <div className="space-y-4">
        <Card className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {confirmationType === "pickup" ? "Pickup" : "Return"} Confirmed!
            </h2>
            <p className="text-sm text-muted-foreground">
              Job {job.jobId} has been marked as {confirmationType === "pickup" ? "picked up" : "returned"}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border-2 border-green-500 mb-6">
            <h3 className="font-semibold text-center mb-4 text-gray-900">Customer P&R QR Code</h3>
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-white rounded-lg shadow-lg">
                <QRCode
                  value={
                    qrCodeUrl ||
                    `${typeof window !== "undefined" ? window.location.origin : ""}/pr/customer?jobId=${job.jobId}&mobile=${encodeURIComponent(job.customerMobile)}`
                  }
                  size={220}
                />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-gray-900">Scan this QR code to access P&R details</p>
              <p className="text-xs text-muted-foreground">Job ID: {job.jobId}</p>
              <p className="text-xs text-muted-foreground">Mobile: {job.customerMobile}</p>
              <div className="pt-2 border-t mt-3">
                <p className="text-xs text-muted-foreground">
                  Customer Scan Status:{" "}
                  {job.customerScanned ? (
                    <span className="text-green-600 font-semibold">✓ Scanned on {job.customerScannedAt}</span>
                  ) : (
                    <span className="text-orange-600 font-semibold">✗ Not Yet Scanned</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-sm text-green-900 mb-3">
                Confirmed {confirmationType === "pickup" ? "Pickup" : "Return"} Information
              </h3>
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

                {confirmationType === "pickup" && pickupData.depositCollected && (
                  <div className="pt-2 border-t border-green-300">
                    <div className="flex justify-between">
                      <span className="text-green-700">Deposit Collected:</span>
                      <span className="font-semibold text-green-900">RM {pickupData.depositCollected}</span>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-green-300 space-y-2">
                  <div>
                    <p className="text-green-700 font-semibold mb-1">Pickup Date | Time</p>
                    <div className="pl-2 space-y-1">
                      <p className="text-xs">
                        <span className="text-green-600">Ordered:</span>{" "}
                        {new Date(job.startDate).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        | {job.startTime}
                      </p>
                      {job.actualStartDate && (
                        <p className="text-xs">
                          <span className="text-green-600">Actual:</span>{" "}
                          {new Date(job.actualStartDate).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}{" "}
                          | {job.actualStartTime}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-green-700 font-semibold mb-1">Return Date | Time</p>
                    <div className="pl-2 space-y-1">
                      <p className="text-xs">
                        <span className="text-green-600">Ordered:</span>{" "}
                        {new Date(job.endDate).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        | {job.endTime}
                      </p>
                      {job.actualEndDate && (
                        <p className="text-xs">
                          <span className="text-green-600">Actual:</span>{" "}
                          {new Date(job.actualEndDate).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}{" "}
                          | {job.actualEndTime}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {confirmationType === "return" &&
                  pickupData.unplannedExtra &&
                  pickupData.unplannedExtra.extraCharge > 0 && (
                    <div className="pt-2 border-t border-green-300">
                      <p className="text-green-700 font-semibold mb-1">Unplanned Extra Hour:</p>
                      <div className="pl-2 space-y-1">
                        <p className="text-xs">
                          <span className="text-green-600">Extra Days:</span> {pickupData.unplannedExtra.daysDiff} days
                        </p>
                        <p className="text-xs">
                          <span className="text-green-600">Extra Hours:</span> {pickupData.unplannedExtra.hoursDiff}{" "}
                          hours
                        </p>
                        <p className="text-xs">
                          <span className="text-green-600">Extra Charge:</span> ${pickupData.unplannedExtra.extraCharge}
                        </p>
                        <p className="text-xs">
                          <span className="text-green-600">Payment Collected:</span> ${pickupData.unplannedExtraPayment}
                        </p>
                      </div>
                    </div>
                  )}

                <div className="pt-2 border-t border-green-300">
                  <div className="flex justify-between">
                    <span className="text-green-700">
                      {confirmationType === "pickup" ? "Pickup" : "Return"} Confirmed By:
                    </span>
                    <span className="font-medium">
                      {confirmationType === "pickup" ? job.pickedUpBy : job.returnedBy}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Confirmed On:</span>
                    <span className="font-medium">
                      {confirmationType === "pickup" ? job.pickedUpOn : job.returnedOn}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {extraChargeInfo && extraChargeInfo.extraCharge > 0 && (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h3 className="font-semibold text-sm text-yellow-900 mb-3">
                  <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                  Extra Hour Fee Applied
                </h3>
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
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button onClick={onBack} className="w-full h-12 bg-green-600 hover:bg-green-700">
            Back to Search
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Search
      </Button>

      <Card className="p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {confirmationType === "pickup" ? "Pickup" : "Return"} Confirmation
          </h2>
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

          {/* Deposit Collection Section */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-sm text-blue-900 mb-3">Deposit Collection</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Deposit Amount:</span>
                <span className="font-semibold">RM {job.depositAmount || "0.00"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Collected Amount:</span>
                <span className="font-semibold text-green-600">RM {pickupData.depositCollected}</span>
              </div>
              {Number.parseFloat(pickupData.depositCollected) === Number.parseFloat(job.depositAmount || "0") && (
                <div className="pt-2 border-t border-blue-300">
                  <p className="text-xs text-green-600 font-semibold flex items-center">
                    <Check className="h-3 w-3 mr-1" />
                    Deposit amount matched
                  </p>
                </div>
              )}
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
            {confirmationType === "pickup" ? "Cfm. Pickup" : "Cfm. Return"}
          </Button>
        </div>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm {confirmationType === "pickup" ? "Pickup" : "Return"}?</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this job as {confirmationType === "pickup" ? "picked up" : "returned"}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              No, Cancel
            </Button>
            <Button onClick={handleFinalConfirm} className="bg-green-600 hover:bg-green-700">
              Yes, Confirm {confirmationType === "pickup" ? "Pickup" : "Return"}
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
