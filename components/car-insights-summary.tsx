"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, DollarSign, Droplet, TrendingUp, Wrench, Activity } from "lucide-react"

const insights = [
  { label: "Days Since Last Service", value: "45 days", icon: Calendar, color: "text-blue-500" },
  { label: "Total Maintenance Cost (YTD)", value: "RM 1,300", icon: DollarSign, color: "text-green-500" },
  { label: "Wash Compliance Rate", value: "92%", icon: Droplet, color: "text-teal-500" },
  { label: "Average Occupancy Rate", value: "78%", icon: TrendingUp, color: "text-purple-500" },
  { label: "Predicted Next Service", value: "Engine Oil", icon: Wrench, color: "text-amber-500" },
  { label: "Confidence Level", value: "92%", icon: Activity, color: "text-red-500" },
]

export function CarInsightsSummary() {
  return (
    <Card className="rounded-2xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-base font-medium">Insights Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, index) => {
          const Icon = insight.icon
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${insight.color}`} />
                <span className="text-sm text-muted-foreground">{insight.label}</span>
              </div>
              <span className="text-sm font-medium">{insight.value}</span>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
