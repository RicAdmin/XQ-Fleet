"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"

const data = [
  { date: "Jan", rate: 65 },
  { date: "Feb", rate: 72 },
  { date: "Mar", rate: 68 },
  { date: "Apr", rate: 75 },
  { date: "May", rate: 82 },
  { date: "Jun", rate: 78 },
  { date: "Jul", rate: 85 },
  { date: "Aug", rate: 88 },
  { date: "Sep", rate: 80 },
  { date: "Oct", rate: 76 },
  { date: "Nov", rate: 78 },
  { date: "Dec", rate: 78.5 },
]

export function AnalyticsOccupancyChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs uppercase text-muted-foreground">Occupancy Rate</span>
                    <span className="text-lg font-bold text-foreground">{payload[0].value}%</span>
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        <Line
          type="monotone"
          dataKey="rate"
          stroke="hsl(var(--chart-1))"
          strokeWidth={3}
          dot={{ fill: "hsl(var(--chart-1))", r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
