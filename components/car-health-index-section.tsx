"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import Image from "next/image"

const gaugeData = [
  { name: "Health", value: 78, fill: "hsl(var(--chart-1))" },
  { name: "Remaining", value: 22, fill: "hsl(var(--muted))" },
]

const healthDistributionData = [
  { month: "Jan", avgHealth: 82 },
  { month: "Feb", avgHealth: 80 },
  { month: "Mar", avgHealth: 79 },
  { month: "Apr", avgHealth: 81 },
  { month: "May", avgHealth: 78 },
  { month: "Jun", avgHealth: 78 },
]

const lowHealthCars = [
  {
    car: "Honda Odyssey",
    image: "/honda-odyssey-mpv.jpg",
    healthScore: 65,
    issues: "High mileage since service",
  },
  {
    car: "Nissan Altima",
    image: "/nissan-altima-sedan.jpg",
    healthScore: 68,
    issues: "Overdue maintenance",
  },
  {
    car: "Chevrolet Tahoe",
    image: "/chevrolet-tahoe-suv.jpg",
    healthScore: 72,
    issues: "Approaching service interval",
  },
]

export function CarHealthIndexSection() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">Car Health Index</h2>
        <p className="text-sm text-muted-foreground">Overall fleet condition and health score distribution</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Gauge Chart */}
        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-base font-medium">Average Fleet Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={gaugeData}
                      cx="50%"
                      cy="50%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={0}
                      dataKey="value"
                    >
                      {gaugeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pb-8">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-foreground">78%</p>
                    <p className="text-sm text-muted-foreground">Good</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">
                  Fleet health is <span className="font-medium text-green-500">stable</span> this month
                </span>
              </div>
              <Button className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700">
                View Detailed Predictions
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Low Health Cars List */}
        <Card className="rounded-2xl shadow-lg lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-medium">Cars Requiring Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowHealthCars.map((car) => (
                <div
                  key={car.car}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Image
                      src={car.image || "/placeholder.svg"}
                      alt={car.car}
                      width={64}
                      height={64}
                      className="rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-medium text-foreground">{car.car}</p>
                      <p className="text-sm text-muted-foreground">{car.issues}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Health Score</p>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              car.healthScore >= 80
                                ? "bg-green-500"
                                : car.healthScore >= 60
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${car.healthScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{car.healthScore}%</span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        car.healthScore >= 80
                          ? "border-green-500 text-green-500"
                          : car.healthScore >= 60
                            ? "border-amber-500 text-amber-500"
                            : "border-red-500 text-red-500"
                      }
                    >
                      {car.healthScore >= 80 ? "Good" : car.healthScore >= 60 ? "Fair" : "Poor"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Score Distribution Over Time */}
      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-base font-medium">Health Score Distribution Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              avgHealth: {
                label: "Average Health Score",
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={healthDistributionData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis domain={[0, 100]} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="avgHealth"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
