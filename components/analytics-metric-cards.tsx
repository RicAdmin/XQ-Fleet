"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Droplet, Calendar, DollarSign } from "lucide-react"

export function AnalyticsMetricCards() {
  const metrics = [
    {
      title: "Fleet Occupancy Rate",
      value: "78.5%",
      change: "+5.2%",
      trend: "up",
      icon: TrendingUp,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      title: "Wash Compliance Rate",
      value: "92.3%",
      change: "+3.1%",
      trend: "up",
      icon: Droplet,
      gradient: "from-teal-500 to-teal-600",
    },
    {
      title: "Total Bookings",
      value: "247",
      change: "+12.5%",
      trend: "up",
      icon: Calendar,
      gradient: "from-indigo-500 to-indigo-600",
    },
    {
      title: "Total Revenue",
      value: "$72,450",
      change: "+8.3%",
      trend: "up",
      icon: DollarSign,
      gradient: "from-emerald-500 to-emerald-600",
    },
  ]

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon
        return (
          <Card key={metric.title} className="rounded-2xl shadow-lg overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                  <p className="text-3xl font-bold text-foreground">{metric.value}</p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                    {metric.change} from last month
                  </p>
                </div>
                <div className={`rounded-xl bg-gradient-to-br ${metric.gradient} p-3`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
