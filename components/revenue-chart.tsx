"use client"

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  { month: "Jan", revenue: 45000, maintenance: 8000 },
  { month: "Feb", revenue: 52000, maintenance: 9500 },
  { month: "Mar", revenue: 48000, maintenance: 7500 },
  { month: "Apr", revenue: 61000, maintenance: 10000 },
  { month: "May", revenue: 68000, maintenance: 11000 },
  { month: "Jun", revenue: 72000, maintenance: 9000 },
]

export function RevenueChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value / 1000}k`}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border border-border bg-card p-2 shadow-sm">
                  <div className="grid gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">Revenue</span>
                      <span className="font-bold text-chart-1">${payload[0].value?.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">Maintenance</span>
                      <span className="font-bold text-chart-2">${payload[1].value?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        <Bar dataKey="revenue" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
        <Bar dataKey="maintenance" fill="hsl(var(--chart-2))" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
