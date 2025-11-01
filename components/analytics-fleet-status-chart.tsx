"use client"

import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip, Legend } from "recharts"

const data = [
  { name: "Available", value: 45, color: "hsl(var(--chart-3))" },
  { name: "Rented", value: 32, color: "hsl(var(--chart-1))" },
  { name: "Maintenance", value: 8, color: "hsl(var(--chart-4))" },
  { name: "Washing", value: 5, color: "hsl(var(--chart-2))" },
]

export function AnalyticsFleetStatusChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs uppercase text-muted-foreground">{payload[0].name}</span>
                    <span className="text-lg font-bold text-foreground">{payload[0].value} cars</span>
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
