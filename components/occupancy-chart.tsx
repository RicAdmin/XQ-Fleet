"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

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
  { date: "Nov", rate: 70 },
  { date: "Dec", rate: 67 },
]

export function OccupancyChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
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
                <div className="rounded-lg border border-border bg-card p-2 shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">Rate</span>
                      <span className="font-bold text-foreground">{payload[0].value}%</span>
                    </div>
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        <Line type="monotone" dataKey="rate" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
