"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, MapPin, Car, Calendar, Fuel, Gauge, Gift, Clock } from "lucide-react"
import { differenceInHours, differenceInMinutes } from "date-fns"

interface CustomerPRViewProps {
  jobID: string
}

export default function CustomerPRView({ jobID }: CustomerPRViewProps) {
  const [jobData, setJobData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [customerPickupConfirmed, setCustomerPickupConfirmed] = useState(false)
  const [customerReturnConfirmed, setCustomerReturnConfirmed] = useState(false)
  const [pickupConfirmedAt, setPickupConfirmedAt] = useState<string | null>(null)
  const [returnConfirmedAt, setReturnConfirmedAt] = useState<string | null>(null)

  useEffect(() => {
    // Fetch job data based on jobID
    // For now, using mock data
    const mockJob = {
      jobID: "JOB-2025-001",
      customerName: "John Doe",
      customerPhone: "+60 12-345 6789",
      carModel: "Toyota Vios",
      carPlate: "ABC 1234",
      pickupLocation: "Langkawi Airport",
      returnLocation: "Langkawi Airport",

      // Pickup Information
      pickedUp: true,
      pickupConfirmedBy: "Sarah Lee",
      pickupConfirmedAt: "2025-01-15 10:30 AM",
      scheduledPickupDate: "2025-01-15",
      scheduledPickupTime: "10:00 AM",
      actualPickupDate: "2025-01-15",
      actualPickupTime: "10:30 AM",
      pickupMileage: 45230,
      pickupFuelLevel: "Full (1)",
      depositCollected: 500,
      customerScannedPickup: false,
      customerPickupConfirmedAt: null,

      // Return Information
      returned: true,
      returnConfirmedBy: "Mike Chen",
      returnConfirmedAt: "2025-01-20 03:45 PM",
      scheduledReturnDate: "2025-01-20",
      scheduledReturnTime: "02:00 PM",
      actualReturnDate: "2025-01-20",
      actualReturnTime: "03:45 PM",
      returnMileage: 45680,
      returnFuelLevel: "Full (1)",
      extraHourCharge: 10,
      lowFuelCharge: 0,
      depositReturned: 490,
      customerScannedReturn: false,
      customerReturnConfirmedAt: null,
    }

    // Simulate API call
    setTimeout(() => {
      setJobData(mockJob)
      setCustomerPickupConfirmed(mockJob.customerScannedPickup)
      setCustomerReturnConfirmed(mockJob.customerScannedReturn)
      setPickupConfirmedAt(mockJob.customerPickupConfirmedAt)
      setReturnConfirmedAt(mockJob.customerReturnConfirmedAt)
      setLoading(false)
    }, 500)
  }, [jobID])

  const handlePickupConfirmation = () => {
    const timestamp = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    setCustomerPickupConfirmed(true)
    setPickupConfirmedAt(timestamp)
    // TODO: Send confirmation to backend
    console.log("[v0] Customer confirmed pickup for job:", jobID, "at", timestamp)
  }

  const handleReturnConfirmation = () => {
    const timestamp = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    setCustomerReturnConfirmed(true)
    setReturnConfirmedAt(timestamp)
    // TODO: Send confirmation to backend
    console.log("[v0] Customer confirmed return for job:", jobID, "at", timestamp)
  }

  const calculateTimeDifference = (
    scheduledDate: string,
    scheduledTime: string,
    actualDate: string,
    actualTime: string,
  ) => {
    try {
      const scheduled = new Date(`${scheduledDate} ${scheduledTime}`)
      const actual = new Date(`${actualDate} ${actualTime}`)
      const hoursDiff = differenceInHours(actual, scheduled)
      const minutesDiff = differenceInMinutes(actual, scheduled) % 60

      if (hoursDiff === 0 && minutesDiff === 0) return null

      return {
        hours: Math.abs(hoursDiff),
        minutes: Math.abs(minutesDiff),
        isLate: actual > scheduled,
      }
    } catch {
      return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!jobData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h1>
          <p className="text-gray-600">Unable to find rental information for job ID: {jobID}</p>
        </div>
      </div>
    )
  }

  const pickupTimeDiff = calculateTimeDifference(
    jobData.scheduledPickupDate,
    jobData.scheduledPickupTime,
    jobData.actualPickupDate,
    jobData.actualPickupTime,
  )

  const returnTimeDiff = calculateTimeDifference(
    jobData.scheduledReturnDate,
    jobData.scheduledReturnTime,
    jobData.actualReturnDate,
    jobData.actualReturnTime,
  )

  const rewards = [
    {
      title: "Underwater World",
      discount: "20% OFF",
      description: "Entry tickets to Langkawi's premier aquarium",
      icon: "🐠",
    },
    {
      title: "Cable Car Ride",
      discount: "15% OFF",
      description: "Scenic cable car to Mount Mat Cincang",
      icon: "🚡",
    },
    {
      title: "Island Hopping",
      discount: "RM 30 OFF",
      description: "Full day island hopping tour",
      icon: "⛵",
    },
    {
      title: "Mangrove Tour",
      discount: "25% OFF",
      description: "Explore Langkawi's mangrove forests",
      icon: "🌳",
    },
    {
      title: "Duty Free Shopping",
      discount: "RM 50 Voucher",
      description: "Redeemable at selected duty-free stores",
      icon: "🛍️",
    },
    {
      title: "Local Restaurant",
      discount: "15% OFF",
      description: "Dining at partner restaurants",
      icon: "🍽️",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center pt-6 pb-2">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-3 shadow-lg">
            <span className="text-3xl font-bold text-white">XQ</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Rental Journey</h1>
          <p className="text-gray-600">Thank you for choosing XQ Rent System</p>
        </div>

        {/* Job Information */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              Rental Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Job ID</p>
                <p className="font-semibold">{jobData.jobID}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-semibold">{jobData.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vehicle</p>
                <p className="font-semibold">{jobData.carModel}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Plate Number</p>
                <p className="font-semibold">{jobData.carPlate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pickup Information */}
        {jobData.pickedUp && (
          <Card className="glass-card border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  Pickup Confirmed
                </CardTitle>
                {customerPickupConfirmed && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    ✓ You Confirmed
                  </Badge>
                )}
              </div>
              <CardDescription>Processed by {jobData.pickupConfirmedBy}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Scheduled Pickup</p>
                      <p className="font-medium text-sm">
                        {jobData.scheduledPickupDate} at {jobData.scheduledPickupTime}
                      </p>
                      {pickupTimeDiff && (
                        <>
                          <p className="text-sm text-muted-foreground mt-1">Actual Pickup</p>
                          <p className="font-semibold">
                            {jobData.actualPickupDate} at {jobData.actualPickupTime}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 text-orange-600" />
                            <p className="text-xs text-orange-600 font-medium">
                              {pickupTimeDiff.isLate ? "+" : "-"}
                              {pickupTimeDiff.hours}h {pickupTimeDiff.minutes}m{" "}
                              {pickupTimeDiff.isLate ? "late" : "early"}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-semibold">{jobData.pickupLocation}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Gauge className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Mileage</p>
                      <p className="font-semibold">{jobData.pickupMileage.toLocaleString()} km</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Fuel className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Fuel Level</p>
                      <p className="font-semibold">{jobData.pickupFuelLevel}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Deposit Collected</span>
                  <span className="text-lg font-bold text-blue-600">RM {jobData.depositCollected}</span>
                </div>
              </div>

              {customerPickupConfirmed && pickupConfirmedAt && (
                <div className="pt-3 border-t bg-green-50 -mx-6 -mb-6 px-6 py-3 rounded-b-lg">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>You confirmed pickup on {pickupConfirmedAt}</span>
                  </div>
                </div>
              )}

              {!customerPickupConfirmed && (
                <Button onClick={handlePickupConfirmation} className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Done Pickup
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Return Information */}
        {jobData.returned && (
          <Card className="glass-card border-l-4 border-l-purple-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-purple-600" />
                  Return Confirmed
                </CardTitle>
                {customerReturnConfirmed && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    ✓ You Confirmed
                  </Badge>
                )}
              </div>
              <CardDescription>Processed by {jobData.returnConfirmedBy}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Scheduled Return</p>
                      <p className="font-medium text-sm">
                        {jobData.scheduledReturnDate} at {jobData.scheduledReturnTime}
                      </p>
                      {returnTimeDiff && (
                        <>
                          <p className="text-sm text-muted-foreground mt-1">Actual Return</p>
                          <p className="font-semibold">
                            {jobData.actualReturnDate} at {jobData.actualReturnTime}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 text-orange-600" />
                            <p className="text-xs text-orange-600 font-medium">
                              {returnTimeDiff.isLate ? "+" : "-"}
                              {returnTimeDiff.hours}h {returnTimeDiff.minutes}m{" "}
                              {returnTimeDiff.isLate ? "late" : "early"}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-semibold">{jobData.returnLocation}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Gauge className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Mileage</p>
                      <p className="font-semibold">{jobData.returnMileage.toLocaleString()} km</p>
                      <p className="text-xs text-muted-foreground">
                        ({(jobData.returnMileage - jobData.pickupMileage).toLocaleString()} km driven)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Fuel className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Fuel Level</p>
                      <p className="font-semibold">{jobData.returnFuelLevel}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t space-y-2 bg-purple-50 -mx-6 px-6 py-4 rounded-lg">
                <p className="font-semibold text-purple-900 mb-2">Deposit Return Calculation</p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Deposit Collected</span>
                  <span className="font-semibold">RM {jobData.depositCollected}</span>
                </div>
                {jobData.extraHourCharge > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Less: Extra Hour Charge</span>
                    <span className="font-semibold text-orange-600">- RM {jobData.extraHourCharge}</span>
                  </div>
                )}
                {jobData.lowFuelCharge > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Less: Low Fuel Surcharge</span>
                    <span className="font-semibold text-orange-600">- RM {jobData.lowFuelCharge}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-purple-200">
                  <span className="font-bold text-purple-900">Returning Deposit</span>
                  <span className="text-xl font-bold text-purple-600">RM {jobData.depositReturned}</span>
                </div>
              </div>

              {customerReturnConfirmed && returnConfirmedAt && (
                <div className="pt-3 border-t bg-green-50 -mx-6 -mb-6 px-6 py-3 rounded-b-lg">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>You confirmed return on {returnConfirmedAt}</span>
                  </div>
                </div>
              )}

              {!customerReturnConfirmed && (
                <Button
                  onClick={handleReturnConfirmation}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Done Return
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Rewards Section */}
        <Card className="glass-card bg-gradient-to-br from-amber-50 to-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-amber-600" />
              Your Langkawi Rewards
            </CardTitle>
            <CardDescription>Thank you for participating! Enjoy these exclusive discounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rewards.map((reward, index) => (
                <Card key={index} className="bg-white/80 hover:bg-white transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{reward.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-sm">{reward.title}</h3>
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700 shrink-0">
                            {reward.discount}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{reward.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-6 text-sm text-muted-foreground">
          <p>Have a wonderful trip in Langkawi! 🌴</p>
          <p className="mt-1">For assistance, contact us at +60 12-345 6789</p>
        </div>
      </div>
    </div>
  )
}
