"use client"

import { useState } from "react"
import { PRQRLogin } from "@/components/pr-qr-login"
import { PRJobSearch } from "@/components/pr-job-search"
import { PRPickupForm } from "@/components/pr-pickup-form"
import { PRConfirmation } from "@/components/pr-confirmation"
import { useUser } from "@/lib/user-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export default function PRPage() {
  const { currentUser, logout } = useUser()
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [pickupData, setPickupData] = useState<any>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [viewingConfirmation, setViewingConfirmation] = useState(false)
  const [confirmationType, setConfirmationType] = useState<"pickup" | "return">("pickup")

  // Check if user is staff (Operation or Super Admin)
  const isStaff = currentUser?.role === "Operation" || currentUser?.role === "Super Admin"

  const handleJobSelect = (job: any) => {
    setSelectedJob(job)
    setViewingConfirmation(false)
  }

  const handlePickupComplete = (data: any) => {
    setPickupData(data)
    setShowConfirmation(true)
  }

  const handleBack = () => {
    if (showConfirmation) {
      // Go back to search page, not the form
      setShowConfirmation(false)
      setSelectedJob(null)
      setPickupData(null)
      setViewingConfirmation(false)
    } else if (selectedJob) {
      setSelectedJob(null)
    }
  }

  const handleConfirmPickup = () => {
    // Generate QR code and complete pickup
    console.log("[v0] Pickup confirmed:", pickupData)
    // Reset state
    setSelectedJob(null)
    setPickupData(null)
    setShowConfirmation(false)
  }

  const handleViewConfirmation = (job: any, type: "pickup" | "return") => {
    console.log("[v0] View confirmation clicked:", { job, type })

    // Check if the job has the confirmed status for the requested type
    if ((type === "pickup" && job.pickedUp) || (type === "return" && job.returned)) {
      setSelectedJob(job)
      setViewingConfirmation(true)
      setConfirmationType(type)
      // Load the pickup data from the job (in real app, this would come from backend)
      setPickupData({
        carAgreementId: "AGR-2025-001",
        agreementImages: [],
        documentImages: [],
        panelImages: [],
        mileage: "50000",
        fuelLevel: "0.75",
        depositCollected: job.depositAmount?.toString() || "0",
        extraHourDate: job.actualEndDate || null,
        extraHourTime: job.actualEndTime || "",
      })
      setShowConfirmation(true)
      console.log("[v0] Showing confirmation page")
    } else {
      console.log("[v0] Confirmation not available for this job")
    }
  }

  if (!isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-red-100">
        <Card className="p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            This page is only accessible to Operation staff and Super Admin users.
          </p>
          <Button onClick={() => (window.location.href = "/dashboard")} className="w-full">
            Return to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  if (!currentUser) {
    return <PRQRLogin />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">P&R System</h1>
            <p className="text-xs text-muted-foreground">{currentUser.name}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={logout} className="h-10 w-10">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-24">
        {showConfirmation ? (
          <PRConfirmation
            job={selectedJob}
            pickupData={pickupData}
            onConfirm={handleConfirmPickup}
            onBack={handleBack}
            confirmationType={confirmationType}
            isViewOnly={viewingConfirmation}
          />
        ) : selectedJob ? (
          <PRPickupForm job={selectedJob} onComplete={handlePickupComplete} onBack={handleBack} />
        ) : (
          <PRJobSearch onJobSelect={handleJobSelect} onViewConfirmation={handleViewConfirmation} />
        )}
      </div>
    </div>
  )
}
