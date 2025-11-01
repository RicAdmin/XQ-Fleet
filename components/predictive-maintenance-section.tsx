"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import Image from "next/image"

const maintenanceCountData = [
  { category: "SUV", count: 5 },
  { category: "Sedan", count: 8 },
  { category: "MPV", count: 3 },
  { category: "Luxury", count: 2 },
]

const accuracyTrendData = [
  { month: "Jan", predicted: 12, actual: 11 },
  { month: "Feb", predicted: 15, actual: 14 },
  { month: "Mar", predicted: 10, actual: 11 },
  { month: "Apr", predicted: 13, actual: 13 },
  { month: "May", predicted: 11, actual: 10 },
  { month: "Jun", predicted: 14, actual: 13 },
]

const predictionData = [
  {
    car: "Toyota Camry",
    image: "/toyota-camry-sedan.png",
    category: "Sedan",
    odometer: 45200,
    kmSinceService: 4800,
    predictedDate: "2025-01-15",
    confidence: 92,
    healthScore: 78,
    status: "due-soon",
    reason: "Based on 5,000 km service interval and current usage trend",
  },
  {
    car: "Honda Odyssey",
    image: "/honda-odyssey-mpv.jpg",
    category: "MPV",
    odometer: 62100,
    kmSinceService: 6200,
    predictedDate: "2025-01-08",
    confidence: 95,
    healthScore: 65,
    status: "urgent",
    reason: "Exceeded recommended service interval by 1,200 km",
  },
  {
    car: "Ford Explorer",
    image: "/ford-explorer-suv.jpg",
    category: "SUV",
    odometer: 38900,
    kmSinceService: 3200,
    predictedDate: "2025-02-10",
    confidence: 88,
    healthScore: 85,
    status: "ok",
    reason: "Normal wear pattern, on schedule for next service",
  },
]

export function PredictiveMaintenanceSection() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">Predictive Maintenance Insights</h2>
        <p className="text-sm text-muted-foreground">
          AI-powered predictions for upcoming maintenance needs based on usage patterns
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl shadow-lg border-red-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-red-500/10">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Urgent Maintenance</p>
                <p className="text-3xl font-bold text-foreground">3</p>
                <Badge variant="destructive" className="mt-1">
                  Requires immediate attention
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-lg border-amber-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Due Soon</p>
                <p className="text-3xl font-bold text-foreground">5</p>
                <Badge className="mt-1 bg-amber-500 hover:bg-amber-600">Within 2 weeks</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-lg border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Good Condition</p>
                <p className="text-3xl font-bold text-foreground">42</p>
                <Badge className="mt-1 bg-green-500 hover:bg-green-600">No action needed</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-base font-medium">Predicted Maintenance Count by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: {
                  label: "Maintenance Count",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={maintenanceCountData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="category" type="category" className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-base font-medium">Predicted vs Actual Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                predicted: {
                  label: "Predicted",
                  color: "hsl(var(--chart-1))",
                },
                actual: {
                  label: "Actual",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={accuracyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line type="monotone" dataKey="predicted" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                  <Line type="monotone" dataKey="actual" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Prediction Table */}
      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-base font-medium">Detailed Maintenance Predictions</CardTitle>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Car</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Odometer (km)</TableHead>
                  <TableHead>KM Since Service</TableHead>
                  <TableHead>Predicted Due Date</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Health Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {predictionData.map((item) => (
                  <TableRow key={item.car}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.car}
                          width={48}
                          height={48}
                          className="rounded-lg object-cover"
                        />
                        <span className="font-medium">{item.car}</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.odometer.toLocaleString()}</TableCell>
                    <TableCell>{item.kmSinceService.toLocaleString()}</TableCell>
                    <TableCell>{item.predictedDate}</TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 cursor-help">
                            <span className="font-medium">{item.confidence}%</span>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{item.reason}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-full max-w-[100px] h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              item.healthScore >= 80
                                ? "bg-green-500"
                                : item.healthScore >= 60
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${item.healthScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{item.healthScore}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.status === "urgent" && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Urgent
                        </Badge>
                      )}
                      {item.status === "due-soon" && (
                        <Badge className="gap-1 bg-amber-500 hover:bg-amber-600">
                          <AlertTriangle className="h-3 w-3" />
                          Due Soon
                        </Badge>
                      )}
                      {item.status === "ok" && (
                        <Badge className="gap-1 bg-green-500 hover:bg-green-600">
                          <CheckCircle className="h-3 w-3" />
                          OK
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline">
                        Create Task
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  )
}
