"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, DollarSign, History } from "lucide-react"
import { format } from "date-fns"

interface Job {
  id: string
  jobId: string
  endDate: string
  totalAmount: number
  extendHourHistory?: Array<{
    extendedDate: string
    extendedTime: string
    hours: number
    isPeak: boolean
    hourlyRate: number
    totalFee: number
    receivedAmount: number
    processedBy: string
    processedOn: string
  }>
}

interface ExtendHourModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  job: Job | null
}

export function ExtendHourModal({ open, onOpenChange, job }: ExtendHourModalProps) {
  const [extendedDate, setExtendedDate] = useState("")
  const [extendedTime, setExtendedTime] = useState("")
  const [receivedAmount, setReceivedAmount] = useState("")

  if (!job) return null

  // Parse ordered return date and time
  const orderedReturnDate = new Date(job.endDate)
  const orderedReturnDateStr = format(orderedReturnDate, "MMMM do, yyyy")
  const orderedReturnTimeStr = format(orderedReturnDate, "h:mm a")

  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 7; hour <= 22; hour++) {
      const time = `${hour.toString().padStart(2, "0")}:00`
      const displayTime = format(new Date(`2000-01-01T${time}`), "h:mm a")
      slots.push({ value: time, label: displayTime })
    }
    return slots
  }

  const timeSlots = generateTimeSlots()

  // Calculate extended hours and fees
  const calculateExtension = () => {
    if (!extendedDate || !extendedTime) return null

    const orderedDateTime = new Date(job.endDate)
    const extendedDateTime = new Date(`${extendedDate}T${extendedTime}`)

    const diffMs = extendedDateTime.getTime() - orderedDateTime.getTime()
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))

    if (diffHours <= 0) return null

    // Determine if peak or low session (simplified logic)
    // Peak: 8am-8pm, Low: 8pm-8am
    const hour = extendedDateTime.getHours()
    const isPeak = hour >= 8 && hour < 20

    // Example rates: Peak $15/hour, Low $10/hour
    const hourlyRate = isPeak ? 15 : 10
    const totalFee = diffHours * hourlyRate

    return {
      hours: diffHours,
      isPeak,
      hourlyRate,
      totalFee,
    }
  }

  const extension = calculateExtension()

  const handleSave = () => {
    // Save logic here
    console.log("[v0] Saving extend hour process:", {
      jobId: job.jobId,
      extendedDate,
      extendedTime,
      receivedAmount,
      extension,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Extend Hour Process - {job.jobId}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Ordered Return Date/Time Section */}
          <Card className="p-3 bg-muted/30 border-border/50">
            <div className="flex items-center gap-2 mb-1.5">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-xs">Ordered Return Date | Time</h3>
            </div>
            <p className="text-sm font-medium">
              {orderedReturnDateStr} | {orderedReturnTimeStr}
            </p>
          </Card>

          {/* Request Extended Date and Time Section */}
          <Card className="p-3 space-y-2.5">
            <h3 className="font-semibold text-xs">Request Extended Date & Time</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <Label htmlFor="extended-date" className="text-xs font-medium">
                  Extended Date
                </Label>
                <Input
                  id="extended-date"
                  type="date"
                  value={extendedDate}
                  onChange={(e) => setExtendedDate(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="extended-time" className="text-xs font-medium">
                  Extended Time (7am - 10pm)
                </Label>
                <Select value={extendedTime} onValueChange={setExtendedTime}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Calculation Section */}
          {extension && (
            <Card className="p-3 space-y-2.5 bg-blue-500/5 border-blue-500/20">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-xs">Calculation Breakdown</h3>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Extended Hours</span>
                  <span className="font-semibold">{extension.hours} hours</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Session Type</span>
                  <Badge
                    variant="outline"
                    className={
                      extension.isPeak
                        ? "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20 text-xs"
                        : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 text-xs"
                    }
                  >
                    {extension.isPeak ? "Peak Session" : "Low Session"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Hourly Rate</span>
                  <span className="font-semibold">${extension.hourlyRate}/hour</span>
                </div>
                <div className="flex justify-between items-center py-2 bg-background/50 rounded-lg px-2.5 mt-1.5">
                  <span className="font-semibold">Extra Fee</span>
                  <span className="text-base font-bold text-green-600 dark:text-green-400">${extension.totalFee}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Payment Collection Section */}
          {extension && (
            <Card className="p-3 space-y-2.5">
              <h3 className="font-semibold text-xs">Payment Collection</h3>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center p-2.5 bg-muted/30 rounded-lg">
                  <span className="text-xs font-medium text-muted-foreground">To be Collected Amount</span>
                  <span className="text-base font-bold">${extension.totalFee}</span>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="received-amount" className="text-xs font-medium">
                    Extended Return Received Amt
                  </Label>
                  <Input
                    id="received-amount"
                    type="number"
                    placeholder="Enter received amount"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
            </Card>
          )}

          {job.extendHourHistory && job.extendHourHistory.length > 0 && (
            <Card className="p-3 space-y-2.5 bg-muted/20">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-xs">Extend Hour History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Extended Date/Time</th>
                      <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Hours</th>
                      <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Session</th>
                      <th className="text-right py-2 px-2 font-semibold text-muted-foreground">Fee</th>
                      <th className="text-right py-2 px-2 font-semibold text-muted-foreground">Received</th>
                      <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Processed By</th>
                      <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Processed On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {job.extendHourHistory.map((record, index) => (
                      <tr key={index} className="border-b border-border/30 hover:bg-muted/30">
                        <td className="py-2 px-2">
                          {format(new Date(`${record.extendedDate}T${record.extendedTime}`), "MMM d, yyyy | h:mm a")}
                        </td>
                        <td className="py-2 px-2">{record.hours}h</td>
                        <td className="py-2 px-2">
                          <Badge
                            variant="outline"
                            className={
                              record.isPeak
                                ? "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20 text-[10px]"
                                : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 text-[10px]"
                            }
                          >
                            {record.isPeak ? "Peak" : "Low"}
                          </Badge>
                        </td>
                        <td className="py-2 px-2 text-right font-semibold text-green-600 dark:text-green-400">
                          ${record.totalFee}
                        </td>
                        <td className="py-2 px-2 text-right font-semibold">${record.receivedAmount}</td>
                        <td className="py-2 px-2">{record.processedBy}</td>
                        <td className="py-2 px-2 text-muted-foreground">
                          {format(new Date(record.processedOn), "MMM d, yyyy h:mm a")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-9">
            Close
          </Button>
          <Button
            onClick={handleSave}
            disabled={!extendedDate || !extendedTime || !receivedAmount}
            className="h-9 bg-[#2663EB] hover:bg-[#2663EB]/90"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
