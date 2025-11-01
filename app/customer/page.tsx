"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import CustomerPRView from "@/components/customer-pr-view"

function CustomerPRContent() {
  const searchParams = useSearchParams()
  const jobID = searchParams.get("jobID")

  if (!jobID) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Access</h1>
          <p className="text-gray-600">Please scan the QR code provided by our staff.</p>
        </div>
      </div>
    )
  }

  return <CustomerPRView jobID={jobID} />
}

export default function CustomerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <CustomerPRContent />
    </Suspense>
  )
}
