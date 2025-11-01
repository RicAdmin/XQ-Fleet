"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, DollarSign, CheckCircle } from "lucide-react"
import { format } from "date-fns"

interface ClientExtendHourModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderedReturnDate: string
  jobId: string
}

export function ClientExtendHourModal({ open, onOpenChange, orderedReturnDate, jobId }: ClientExtendHourModalProps) {
  const [extendedDate, setExtendedDate] = useState("")
  const [extendedTime, setExtendedTime] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)

  // Parse ordered return date and time
  const orderedDateTime = new Date(orderedReturnDate)
  const orderedReturnDateStr = format(orderedDateTime, "MMMM do, yyyy")
  const orderedReturnTimeStr = format(orderedDateTime, "h:mm a")

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

    const extendedDateTime = new Date(`${extendedDate}T${extendedTime}`)

    const diffMs = extendedDateTime.getTime() - orderedDateTime.getTime()
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))

    if (diffHours <= 0) return null

    // Determine if peak or low session
    const hour = extendedDateTime.getHours()
    const isPeak = hour >= 8 && hour < 20

    // Example rates: Peak RM15/hour, Low RM10/hour
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

  const handleSubmitRequest = () => {
    console.log("[v0] Client requesting extend hour:", {
      jobId,
      extendedDate,
      extendedTime,
      extension,
    })
    setShowSuccess(true)
  }

  const handleClose = () => {
    setShowSuccess(false)
    setExtendedDate("")
    setExtendedTime("")
    onOpenChange(false)
  }

  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-6 space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground">Request Sent!</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your request for extend hour has been sent to the Car Operator. You will be informed soon about the
                approval status.
              </p>
            </div>
            <Button onClick={handleClose} className="w-full h-12 bg-gradient-to-r from-primary to-primary/90">
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Request Extend Hour</DialogTitle>
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
                  min={format(orderedDateTime, "yyyy-MM-dd")}
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
                <h3 className="font-semibold text-xs">Estimated Cost Breakdown</h3>
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
                  <span className="font-semibold">RM {extension.hourlyRate}/hour</span>
                </div>
                <div className="flex justify-between items-center py-2 bg-background/50 rounded-lg px-2.5 mt-1.5">
                  <span className="font-semibold">Estimated Extra Fee</span>
                  <span className="text-base font-bold text-green-600 dark:text-green-400">
                    RM {extension.totalFee}
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-11 flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmitRequest}
            disabled={!extendedDate || !extendedTime}
            className="h-11 flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary font-semibold"
          >
            Save & Request for Extend Hour
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
