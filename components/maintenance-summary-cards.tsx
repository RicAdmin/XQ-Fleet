"use client"

import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Clock, CheckCircle, Gauge } from "lucide-react"

export function MaintenanceSummaryCards() {
  const cards = [
    {
      title: "Cars with Urgent Maintenance",
      value: "3",
      icon: AlertTriangle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Cars Due Soon",
      value: "7",
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Cars OK",
      value: "15",
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Average Daily Mileage",
      value: "127 km",
      icon: Gauge,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index} className="rounded-2xl shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">{card.value}</p>
                </div>
                <div className={`rounded-full p-3 ${card.bgColor}`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
