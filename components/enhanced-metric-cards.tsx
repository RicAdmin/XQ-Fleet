"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Activity, Droplet, Calendar, Wrench } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { LineChart, Line, ResponsiveContainer } from "recharts"

const sparklineData = [
  { value: 65 },
  { value: 68 },
  { value: 72 },
  { value: 70 },
  { value: 75 },
  { value: 78 },
  { value: 82 },
]

const metrics = [
  {
    name: "Fleet Occupancy Rate",
    value: "82%",
    trend: "+5.2%",
    isPositive: true,
    icon: Activity,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    tooltip: "Occupancy Rate = total rented days ÷ available days",
    sparkline: sparklineData,
  },
  {
    name: "Wash Compliance Rate",
    value: "94%",
    trend: "+2.1%",
    isPositive: true,
    icon: Droplet,
    color: "text-teal-500",
    bgColor: "bg-teal-500/10",
    tooltip: "Percentage of cars washed on schedule",
    sparkline: [
      { value: 88 },
      { value: 90 },
      { value: 89 },
      { value: 91 },
      { value: 92 },
      { value: 93 },
      { value: 94 },
    ],
  },
  {
    name: "Total Bookings",
    value: "247",
    trend: "+12.5%",
    isPositive: true,
    icon: Calendar,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    tooltip: "Total bookings this month",
    sparkline: [
      { value: 180 },
      { value: 195 },
      { value: 210 },
      { value: 220 },
      { value: 230 },
      { value: 240 },
      { value: 247 },
    ],
  },
  {
    name: "Cars Due for Maintenance",
    value: "8",
    trend: "-3 cars",
    isPositive: true,
    icon: Wrench,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    tooltip: "Number of cars requiring maintenance soon",
    sparkline: [{ value: 15 }, { value: 13 }, { value: 12 }, { value: 11 }, { value: 10 }, { value: 9 }, { value: 8 }],
  },
]

export function EnhancedMetricCards() {
  return (
    <TooltipProvider>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Tooltip key={metric.name}>
              <TooltipTrigger asChild>
                <Card className="rounded-2xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                            <Icon className={`h-4 w-4 ${metric.color}`} />
                          </div>
                          <p className="text-sm font-medium text-muted-foreground">{metric.name}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                          <div className="flex items-center gap-1">
                            {metric.isPositive ? (
                              <TrendingUp className="h-3 w-3 text-green-500" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-500" />
                            )}
                            <span
                              className={`text-xs font-medium ${metric.isPositive ? "text-green-500" : "text-red-500"}`}
                            >
                              {metric.trend}
                            </span>
                            <span className="text-xs text-muted-foreground">vs last month</span>
                          </div>
                        </div>
                      </div>
                      <div className="w-20 h-12">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={metric.sparkline}>
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke={metric.color.replace("text-", "")}
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>{metric.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
