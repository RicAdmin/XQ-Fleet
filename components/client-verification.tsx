"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Lock } from "lucide-react"
import Image from "next/image"

interface ClientVerificationProps {
  onVerify: (jobId: string, mobileNumber: string) => void
}

export function ClientVerification({ onVerify }: ClientVerificationProps) {
  const [jobId, setJobId] = useState("")
  const [mobileNumber, setMobileNumber] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Validate inputs
    if (!jobId.trim() || !mobileNumber.trim()) {
      setError("Please enter both Job ID and Mobile Number")
      setIsLoading(false)
      return
    }

    // Simulate verification delay
    setTimeout(() => {
      onVerify(jobId.trim(), mobileNumber.trim())
      setIsLoading(false)
    }, 800)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <Card className="w-full max-w-md relative glass-card border-white/40 shadow-2xl">
        <div className="p-8 space-y-8">
          {/* Logo and Header */}
          <div className="text-center space-y-5">
            <div className="flex justify-center">
              <div className="relative h-24 w-24 rounded-2xl overflow-hidden ring-2 ring-primary/20 shadow-lg">
                <Image
                  src="/xq-car-logo.png"
                  alt="XQ Car Rental"
                  width={96}
                  height={96}
                  className="object-cover"
                  priority
                />
              </div>
            </div>
            <div className="space-y-2.5">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Welcome Back</h1>
              <p className="text-base text-muted-foreground leading-relaxed px-4">
                Enter your Job ID and Mobile Number to view your rental details
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2.5">
              <label htmlFor="jobId" className="text-base font-semibold text-foreground">
                Job ID
              </label>
              <Input
                id="jobId"
                type="text"
                placeholder="e.g., JOB-2025-001"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                className="h-14 text-base"
                autoComplete="off"
              />
            </div>

            <div className="space-y-2.5">
              <label htmlFor="mobileNumber" className="text-base font-semibold text-foreground">
                Mobile Number
              </label>
              <Input
                id="mobileNumber"
                type="tel"
                placeholder="e.g., +60123456789"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="h-14 text-base"
                autoComplete="tel"
              />
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2.5">
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <Lock className="h-5 w-5" />
                  <span>Access My Rental</span>
                </div>
              )}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="pt-6 border-t border-border/50">
            <p className="text-sm text-muted-foreground text-center mb-3.5 font-medium">Demo Credentials</p>
            <div className="grid gap-2.5">
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Job ID:</span>
                  <code className="font-mono font-semibold text-foreground">JOB-2025-001</code>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Mobile:</span>
                  <code className="font-mono font-semibold text-foreground">+60123456789</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
