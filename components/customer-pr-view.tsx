"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
  const [showPickupDialog, setShowPickupDialog] = useState(false)
  const [showReturnDialog, setShowReturnDialog] = useState(false)

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
    setShowPickupDialog(false)
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
    setShowReturnDialog(false)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 sm:p-6 pb-20">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center pt-8 pb-4">
          <div className="inline-flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl mb-4 shadow-2xl">
            <span className="text-4xl sm:text-5xl font-bold text-white">XQ</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 leading-tight">Your Rental Journey</h1>
          <p className="text-lg text-gray-600">Thank you for choosing XQ Rent System</p>
        </div>

        <Card className="shadow-xl border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
            <div className="flex items-center gap-3 text-white mb-2">
              <Car className="h-7 w-7" />
              <h2 className="text-2xl font-bold">Rental Details</h2>
            </div>
          </div>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">Job ID</p>
                <p className="text-xl font-bold text-gray-900">{jobData.jobID}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">Customer</p>
                <p className="text-xl font-bold text-gray-900">{jobData.customerName}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">Vehicle</p>
                <p className="text-xl font-bold text-gray-900">{jobData.carModel}</p>
                <p className="text-lg text-gray-600 mt-1">{jobData.carPlate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {jobData.pickedUp && (
          <Card className="shadow-xl border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 text-white">
                  <CheckCircle2 className="h-7 w-7" />
                  <div>
                    <h2 className="text-2xl font-bold">Pickup Confirmed</h2>
                    <p className="text-blue-100 text-sm mt-1">By {jobData.pickupConfirmedBy}</p>
                  </div>
                </div>
                {customerPickupConfirmed && (
                  <Badge className="bg-green-500 text-white text-base px-4 py-2 border-0">✓ You Confirmed</Badge>
                )}
              </div>
            </div>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-5">
                <div className="bg-blue-50 p-5 rounded-xl">
                  <div className="flex items-start gap-3 mb-3">
                    <Calendar className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-2">Scheduled Pickup</p>
                      <p className="text-lg font-semibold text-gray-900">{jobData.scheduledPickupDate}</p>
                      <p className="text-xl font-bold text-blue-600 mt-1">{jobData.scheduledPickupTime}</p>
                      {pickupTimeDiff && (
                        <div className="mt-4 pt-4 border-t border-blue-200">
                          <p className="text-sm text-gray-600 mb-2">Actual Pickup</p>
                          <p className="text-lg font-semibold text-gray-900">{jobData.actualPickupDate}</p>
                          <p className="text-xl font-bold text-gray-900 mt-1">{jobData.actualPickupTime}</p>
                          <div className="flex items-center gap-2 mt-3 bg-orange-100 p-3 rounded-lg">
                            <Clock className="h-5 w-5 text-orange-600 flex-shrink-0" />
                            <p className="text-base text-orange-700 font-semibold">
                              {pickupTimeDiff.isLate ? "+" : "-"}
                              {pickupTimeDiff.hours}h {pickupTimeDiff.minutes}m{" "}
                              {pickupTimeDiff.isLate ? "late" : "early"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-5 rounded-xl">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-6 w-6 text-gray-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Pickup Location</p>
                      <p className="text-lg font-bold text-gray-900">{jobData.pickupLocation}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-5 rounded-xl">
                    <div className="flex items-start gap-2 mb-2">
                      <Gauge className="h-5 w-5 text-gray-600 mt-1 flex-shrink-0" />
                      <p className="text-sm text-gray-600">Mileage</p>
                    </div>
                    <p className="text-xl font-bold text-gray-900">{jobData.pickupMileage.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-1">km</p>
                  </div>
                  <div className="bg-gray-50 p-5 rounded-xl">
                    <div className="flex items-start gap-2 mb-2">
                      <Fuel className="h-5 w-5 text-gray-600 mt-1 flex-shrink-0" />
                      <p className="text-sm text-gray-600">Fuel</p>
                    </div>
                    <p className="text-xl font-bold text-gray-900">{jobData.pickupFuelLevel}</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-xl text-white">
                  <p className="text-blue-100 text-base mb-2">Deposit Collected</p>
                  <p className="text-4xl font-bold">RM {jobData.depositCollected}</p>
                </div>
              </div>

              {customerPickupConfirmed && pickupConfirmedAt && (
                <div className="bg-green-50 p-5 rounded-xl border-2 border-green-200">
                  <div className="flex items-center gap-3 text-green-700">
                    <CheckCircle2 className="h-6 w-6 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-base">You confirmed pickup</p>
                      <p className="text-sm text-green-600 mt-1">{pickupConfirmedAt}</p>
                    </div>
                  </div>
                </div>
              )}

              {!customerPickupConfirmed && (
                <Button
                  onClick={() => setShowPickupDialog(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white h-16 text-lg font-semibold rounded-xl shadow-lg"
                >
                  <CheckCircle2 className="mr-3 h-6 w-6" />
                  Done Pickup
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {jobData.returned && (
          <Card className="shadow-xl border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 text-white">
                  <CheckCircle2 className="h-7 w-7" />
                  <div>
                    <h2 className="text-2xl font-bold">Return Confirmed</h2>
                    <p className="text-purple-100 text-sm mt-1">By {jobData.returnConfirmedBy}</p>
                  </div>
                </div>
                {customerReturnConfirmed && (
                  <Badge className="bg-green-500 text-white text-base px-4 py-2 border-0">✓ You Confirmed</Badge>
                )}
              </div>
            </div>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-5">
                <div className="bg-purple-50 p-5 rounded-xl">
                  <div className="flex items-start gap-3 mb-3">
                    <Calendar className="h-6 w-6 text-purple-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-2">Scheduled Return</p>
                      <p className="text-lg font-semibold text-gray-900">{jobData.scheduledReturnDate}</p>
                      <p className="text-xl font-bold text-purple-600 mt-1">{jobData.scheduledReturnTime}</p>
                      {returnTimeDiff && (
                        <div className="mt-4 pt-4 border-t border-purple-200">
                          <p className="text-sm text-gray-600 mb-2">Actual Return</p>
                          <p className="text-lg font-semibold text-gray-900">{jobData.actualReturnDate}</p>
                          <p className="text-xl font-bold text-gray-900 mt-1">{jobData.actualReturnTime}</p>
                          <div className="flex items-center gap-2 mt-3 bg-orange-100 p-3 rounded-lg">
                            <Clock className="h-5 w-5 text-orange-600 flex-shrink-0" />
                            <p className="text-base text-orange-700 font-semibold">
                              {returnTimeDiff.isLate ? "+" : "-"}
                              {returnTimeDiff.hours}h {returnTimeDiff.minutes}m{" "}
                              {returnTimeDiff.isLate ? "late" : "early"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-5 rounded-xl">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-6 w-6 text-gray-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Return Location</p>
                      <p className="text-lg font-bold text-gray-900">{jobData.returnLocation}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-5 rounded-xl">
                    <div className="flex items-start gap-2 mb-2">
                      <Gauge className="h-5 w-5 text-gray-600 mt-1 flex-shrink-0" />
                      <p className="text-sm text-gray-600">Mileage</p>
                    </div>
                    <p className="text-xl font-bold text-gray-900">{jobData.returnMileage.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      +{(jobData.returnMileage - jobData.pickupMileage).toLocaleString()} km
                    </p>
                  </div>
                  <div className="bg-gray-50 p-5 rounded-xl">
                    <div className="flex items-start gap-2 mb-2">
                      <Fuel className="h-5 w-5 text-gray-600 mt-1 flex-shrink-0" />
                      <p className="text-sm text-gray-600">Fuel</p>
                    </div>
                    <p className="text-xl font-bold text-gray-900">{jobData.returnFuelLevel}</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200">
                  <p className="text-lg font-bold text-purple-900 mb-4">Deposit Return</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-base text-gray-700">Deposit Collected</span>
                      <span className="text-xl font-bold text-gray-900">RM {jobData.depositCollected}</span>
                    </div>
                    {jobData.extraHourCharge > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-base text-gray-700">Extra Hour Charge</span>
                        <span className="text-xl font-bold text-orange-600">- RM {jobData.extraHourCharge}</span>
                      </div>
                    )}
                    {jobData.lowFuelCharge > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-base text-gray-700">Low Fuel Surcharge</span>
                        <span className="text-xl font-bold text-orange-600">- RM {jobData.lowFuelCharge}</span>
                      </div>
                    )}
                    <div className="pt-4 border-t-2 border-purple-300 flex justify-between items-center">
                      <span className="text-lg font-bold text-purple-900">Returning Deposit</span>
                      <span className="text-3xl font-bold text-purple-600">RM {jobData.depositReturned}</span>
                    </div>
                  </div>
                </div>
              </div>

              {customerReturnConfirmed && returnConfirmedAt && (
                <div className="bg-green-50 p-5 rounded-xl border-2 border-green-200">
                  <div className="flex items-center gap-3 text-green-700">
                    <CheckCircle2 className="h-6 w-6 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-base">You confirmed return</p>
                      <p className="text-sm text-green-600 mt-1">{returnConfirmedAt}</p>
                    </div>
                  </div>
                </div>
              )}

              {!customerReturnConfirmed && (
                <Button
                  onClick={() => setShowReturnDialog(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white h-16 text-lg font-semibold rounded-xl shadow-lg"
                >
                  <CheckCircle2 className="mr-3 h-6 w-6" />
                  Done Return
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="shadow-xl border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6">
            <div className="flex items-center gap-3 text-white">
              <Gift className="h-7 w-7" />
              <div>
                <h2 className="text-2xl font-bold">Your Langkawi Rewards</h2>
                <p className="text-amber-100 text-sm mt-1">Exclusive discounts for you!</p>
              </div>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-4">
              {rewards.map((reward, index) => (
                <Card
                  key={index}
                  className="bg-gradient-to-br from-white to-amber-50 border-2 border-amber-200 hover:border-amber-400 transition-all cursor-pointer shadow-md hover:shadow-lg"
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="text-5xl flex-shrink-0">{reward.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-bold text-lg text-gray-900 leading-tight">{reward.title}</h3>
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-base px-3 py-1 border-0 shrink-0">
                            {reward.discount}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{reward.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="text-center py-8 space-y-3">
          <p className="text-xl font-semibold text-gray-700">Have a wonderful trip in Langkawi! 🌴</p>
          <p className="text-base text-gray-600">For assistance, contact us at</p>
          <p className="text-lg font-bold text-blue-600">+60 12-345 6789</p>
        </div>
      </div>

      {/* Confirmation dialog for pickup */}
      <AlertDialog open={showPickupDialog} onOpenChange={setShowPickupDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Pickup Completion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to confirm that you have completed the pickup process? This action will be recorded
              with a timestamp.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction onClick={handlePickupConfirmation} className="bg-blue-600 hover:bg-blue-700">
              Yes, Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation dialog for return */}
      <AlertDialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Return Completion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to confirm that you have completed the return process? This action will be recorded
              with a timestamp.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction onClick={handleReturnConfirmation} className="bg-purple-600 hover:bg-purple-700">
              Yes, Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
