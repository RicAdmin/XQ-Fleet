"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wrench } from "lucide-react"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"

const predictions = [
  {
    type: "Engine Oil",
    dueDate: "2025-01-20",
    confidence: 92,
    severity: "urgent",
  },
  {
    type: "Tire Rotation",
    dueDate: "2025-02-10",
    confidence: 85,
    severity: "due-soon",
  },
  {
    type: "Brake Pads",
    dueDate: "2025-03-15",
    confidence: 78,
    severity: "ok",
  },
]

const accuracyData = [
  { month: "Jul", predicted: 3, actual: 3 },
  { month: "Aug", predicted: 2, actual: 2 },
  { month: "Sep", predicted: 4, actual: 3 },
  { month: "Oct", predicted: 2, actual: 2 },
  { month: "Nov", predicted: 3, actual: 4 },
  { month: "Dec", predicted: 2, actual: 2 },
]

export function CarPredictionCards() {
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "urgent":
        return <Badge className="bg-red-500 hover:bg-red-600">Urgent</Badge>
      case "due-soon":
        return <Badge className="bg-amber-500 hover:bg-amber-600">Due Soon</Badge>
      case "ok":
        return <Badge className="bg-green-500 hover:bg-green-600">OK</Badge>
      default:
        return <Badge>{severity}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {predictions.map((prediction, index) => (
          <Card key={index} className="rounded-2xl shadow-lg">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold">{prediction.type}</h3>
                </div>
                {getSeverityBadge(prediction.severity)}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Predicted Due</span>
                  <span className="font-medium">{prediction.dueDate}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className="font-medium">{prediction.confidence}%</span>
                </div>
              </div>
              <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                Schedule Maintenance
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl shadow-lg">
        <CardContent className="pt-6">
          <h3 className="text-base font-medium mb-4">Predicted vs Actual Maintenance Accuracy</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={accuracyData}>
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
              <Legend />
              <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={2} name="Predicted" />
              <Line type="monotone" dataKey="actual" stroke="#14b8a6" strokeWidth={2} name="Actual" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
