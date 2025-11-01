"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

const maintenanceHistory = [
  { date: "2024-11-15", type: "Engine Oil Change", cost: 250, notes: "Regular service", status: "completed" },
  { date: "2024-09-20", type: "Tire Rotation", cost: 150, notes: "All tires rotated", status: "completed" },
  { date: "2024-07-10", type: "Brake Inspection", cost: 100, notes: "Brake pads OK", status: "completed" },
  { date: "2024-05-05", type: "Full Service", cost: 800, notes: "Annual service", status: "completed" },
]

const usageHistory = [
  { period: "Dec 1-7", customer: "Ahmad Ali", distance: 450, revenue: 350 },
  { period: "Nov 15-20", customer: "Sarah Lee", distance: 380, revenue: 300 },
  { period: "Nov 1-5", customer: "John Tan", distance: 520, revenue: 400 },
  { period: "Oct 20-25", customer: "Mary Wong", distance: 290, revenue: 250 },
]

const washHistory = [
  { date: "2024-12-15", vendor: "Clean Car Wash", cost: 50, status: "completed" },
  { date: "2024-12-08", vendor: "Quick Wash", cost: 45, status: "completed" },
  { date: "2024-12-01", vendor: "Clean Car Wash", cost: 50, status: "missed" },
  { date: "2024-11-24", vendor: "Quick Wash", cost: 45, status: "completed" },
]

const odometerData = [
  { month: "Jul", odometer: 75000 },
  { month: "Aug", odometer: 77500 },
  { month: "Sep", odometer: 80000 },
  { month: "Oct", odometer: 82500 },
  { month: "Nov", odometer: 85000 },
  { month: "Dec", odometer: 87500 },
]

export function MaintenanceHistoryTabs() {
  return (
    <Card className="rounded-2xl shadow-lg">
      <CardContent className="pt-6">
        <Tabs defaultValue="maintenance" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="maintenance">Maintenance History</TabsTrigger>
            <TabsTrigger value="usage">Usage History</TabsTrigger>
            <TabsTrigger value="wash">Wash History</TabsTrigger>
          </TabsList>
          <TabsContent value="maintenance" className="space-y-4">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Cost (RM)</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenanceHistory.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>{record.type}</TableCell>
                      <TableCell>RM {record.cost}</TableCell>
                      <TableCell>{record.notes}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <FileText className="h-4 w-4 mr-1" />
                          Invoice
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="usage" className="space-y-4">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={odometerData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
                <Line type="monotone" dataKey="odometer" stroke="#14b8a6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rental Period</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Distance (km)</TableHead>
                    <TableHead>Revenue (RM)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usageHistory.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell>{record.period}</TableCell>
                      <TableCell>{record.customer}</TableCell>
                      <TableCell>{record.distance} km</TableCell>
                      <TableCell>RM {record.revenue}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="wash" className="space-y-4">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Cost (RM)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {washHistory.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>{record.vendor}</TableCell>
                      <TableCell>RM {record.cost}</TableCell>
                      <TableCell>
                        {record.status === "completed" ? (
                          <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>
                        ) : (
                          <Badge className="bg-red-500 hover:bg-red-600">Missed</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
