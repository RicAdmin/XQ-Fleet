"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Clock, TrendingUp } from "lucide-react"

// Mock data for average rental duration by category
const categoryData = [
  { category: "Sedan", avgDays: 4.2, jobs: 85 },
  { category: "MPV", avgDays: 5.8, jobs: 62 },
  { category: "SUV", avgDays: 6.5, jobs: 45 },
  { category: "Hatchback", avgDays: 3.5, jobs: 38 },
  { category: "Convertible", avgDays: 2.8, jobs: 17 },
]

const COLORS = ["#2663EB", "#FF8945", "#10b981", "#f59e0b", "#8b5cf6"]

export function RentalDurationStats() {
  const overallAvgDays = 4.8
  const totalJobs = categoryData.reduce((sum, cat) => sum + cat.jobs, 0)

  return (
    <Card className="rounded-xl glass-card border-white/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#FF8945]" />
            <CardTitle className="text-sm font-medium">Average Rental Duration</CardTitle>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-lg">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-bold text-blue-600">{overallAvgDays} days</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Overall stats */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Total Jobs</p>
              <p className="text-2xl font-bold text-foreground">{totalJobs}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg per Job</p>
              <p className="text-2xl font-bold text-foreground">{overallAvgDays} days</p>
            </div>
          </div>

          {/* Category breakdown */}
          <div className="space-y-3">
            {categoryData.map((cat, index) => (
              <div key={cat.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                    <span className="text-sm font-medium text-foreground">{cat.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{cat.jobs} jobs</span>
                    <span className="text-sm font-bold text-foreground">{cat.avgDays} days</span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(cat.avgDays / 7) * 100}%`,
                      backgroundColor: COLORS[index],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="h-[200px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} label={{ value: "Days", angle: -90, position: "insideLeft" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="avgDays" name="Avg Days" radius={[4, 4, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
