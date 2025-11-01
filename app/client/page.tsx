"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ClientVerification } from "@/components/client-verification"
import { ClientPortal } from "@/components/client-portal"

function ClientPageContent() {
  const [isVerified, setIsVerified] = useState(false)
  const [jobId, setJobId] = useState("")
  const [mobileNumber, setMobileNumber] = useState("")

  const searchParams = useSearchParams()

  useEffect(() => {
    const jobIdParam = searchParams.get("jobId")
    const mobileParam = searchParams.get("mobile")

    if (jobIdParam && mobileParam) {
      // Auto-verify with query parameters
      setJobId(jobIdParam)
      setMobileNumber(mobileParam)
      setIsVerified(true)
    }
  }, [searchParams])

  const handleVerify = (verifiedJobId: string, verifiedMobile: string) => {
    // In real app, verify credentials with backend
    // For demo, accept any input
    setJobId(verifiedJobId)
    setMobileNumber(verifiedMobile)
    setIsVerified(true)
  }

  const handleLogout = () => {
    setIsVerified(false)
    setJobId("")
    setMobileNumber("")
    // Clear URL parameters
    window.history.replaceState({}, "", "/client")
  }

  if (!isVerified) {
    return <ClientVerification onVerify={handleVerify} />
  }

  return <ClientPortal jobId={jobId} mobileNumber={mobileNumber} onLogout={handleLogout} />
}

export default function ClientPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <ClientPageContent />
    </Suspense>
  )
}
