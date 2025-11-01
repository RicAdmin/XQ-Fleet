"use client"

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts"

const data = [
  { month: "Jan", washCost: 2400, maintenanceCost: 8000 },
  { month: "Feb", washCost: 2800, maintenanceCost: 9500 },
  { month: "Mar", washCost: 2200, maintenanceCost: 7500 },
  { month: "Apr", washCost: 3100, maintenanceCost: 10000 },
  { month: "May", washCost: 3400, maintenanceCost: 11000 },
  { month: "Jun", washCost: 2900, maintenanceCost: 9000 },
]

export function AnalyticsWashCostChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
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
                <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                  <div className="grid gap-2">
                    <div className="flex flex-col">
                      <span className="text-xs uppercase text-muted-foreground">Wash Cost</span>
                      <span className="text-base font-bold text-teal-600">${payload[0].value?.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs uppercase text-muted-foreground">Maintenance Cost</span>
                      <span className="text-base font-bold text-blue-600">${payload[1].value?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        <Legend
          wrapperStyle={{ paddingTop: "20px" }}
          iconType="circle"
          formatter={(value) => (
            <span className="text-sm text-muted-foreground">
              {value === "washCost" ? "Wash Cost" : "Maintenance Cost"}
            </span>
          )}
        />
        <Bar dataKey="washCost" fill="hsl(var(--chart-2))" radius={[8, 8, 0, 0]} />
        <Bar dataKey="maintenanceCost" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
