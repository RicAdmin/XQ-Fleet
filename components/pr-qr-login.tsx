"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QrCode, Scan } from "lucide-react"
import { useUser } from "@/lib/user-context"
import { useRouter } from "next/navigation"
import Image from "next/image"

export function PRQRLogin() {
  const [isScanning, setIsScanning] = useState(false)
  const { login } = useUser()
  const router = useRouter()

  const handleQRScan = async () => {
    setIsScanning(true)

    // Simulate QR code scan - in production, this would use device camera
    setTimeout(async () => {
      // Demo: Auto-login as Operation user
      const success = await login("sarah@xqrentals.com", "operation123")
      if (success) {
        router.push("/pr")
      }
      setIsScanning(false)
    }, 1500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50/30">
      <Card className="p-8 max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl" />
            <Image
              src="/xq-logo.png"
              alt="XQ Logo"
              width={96}
              height={96}
              className="rounded-3xl relative z-10 shadow-lg"
            />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">P&R System</h1>
          <p className="text-sm text-muted-foreground">Pickup & Return Management</p>
        </div>

        <div className="py-8">
          <div className="w-48 h-48 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
            {isScanning ? (
              <div className="animate-pulse">
                <Scan className="h-24 w-24 text-blue-600" />
              </div>
            ) : (
              <QrCode className="h-24 w-24 text-blue-600" />
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleQRScan}
            disabled={isScanning}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isScanning ? (
              <>
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Scanning...
              </>
            ) : (
              <>
                <Scan className="h-5 w-5 mr-2" />
                Scan QR Code to Login
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground">Scan your unique staff QR code to access the P&R system</p>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">Demo: Click the button above to simulate QR scan login</p>
        </div>
      </Card>
    </div>
  )
}
