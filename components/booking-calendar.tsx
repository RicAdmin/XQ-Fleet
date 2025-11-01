"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { useState } from "react"

interface Booking {
  id: string
  bookingId: string
  carName: string
  customerName: string
  startDate: string
  endDate: string
  status: "Pending" | "Confirmed" | "Completed" | "Cancelled"
  totalAmount: number
}

interface BookingCalendarProps {
  bookings: Booking[]
}

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  Confirmed: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  Completed: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  Cancelled: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
}

export function BookingCalendar({ bookings }: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  // Get bookings for selected date
  const bookingsForDate = bookings.filter((booking) => {
    if (!selectedDate) return false
    const start = new Date(booking.startDate)
    const end = new Date(booking.endDate)
    const selected = new Date(selectedDate)
    selected.setHours(0, 0, 0, 0)
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)
    return selected >= start && selected <= end
  })

  // Get dates that have bookings
  const datesWithBookings = bookings.reduce((acc, booking) => {
    const start = new Date(booking.startDate)
    const end = new Date(booking.endDate)
    const current = new Date(start)

    while (current <= end) {
      const dateStr = current.toISOString().split("T")[0]
      acc.add(dateStr)
      current.setDate(current.getDate() + 1)
    }

    return acc
  }, new Set<string>())

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Calendar */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base font-medium">Booking Calendar</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
            modifiers={{
              booked: (date) => {
                const dateStr = date.toISOString().split("T")[0]
                return datesWithBookings.has(dateStr)
              },
            }}
            modifiersStyles={{
              booked: {
                backgroundColor: "hsl(var(--primary) / 0.1)",
                fontWeight: "bold",
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Bookings for Selected Date */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Bookings for{" "}
            {selectedDate
              ? selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
              : "Selected Date"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookingsForDate.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No bookings for this date</div>
          ) : (
            <div className="space-y-3">
              {bookingsForDate.map((booking) => (
                <div
                  key={booking.id}
                  className="p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-foreground">{booking.carName}</p>
                      <p className="text-sm text-muted-foreground">{booking.customerName}</p>
                    </div>
                    <Badge variant="outline" className={statusColors[booking.status]}>
                      {booking.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{booking.bookingId}</span>
                    <span className="font-semibold text-foreground">${booking.totalAmount}</span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {new Date(booking.startDate).toLocaleDateString()} -{" "}
                    {new Date(booking.endDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
