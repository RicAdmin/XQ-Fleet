"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

const data = [
  { category: "Sedan", urgent: 2, dueSoon: 3, ok: 8 },
  { category: "SUV", urgent: 1, dueSoon: 3, ok: 5 },
  { category: "MPV", urgent: 0, dueSoon: 1, ok: 2 },
]

export function MaintenanceCountChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="category" className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
        />
        <Legend />
        <Bar dataKey="urgent" fill="#ef4444" name="Urgent" radius={[8, 8, 0, 0]} />
        <Bar dataKey="dueSoon" fill="#f59e0b" name="Due Soon" radius={[8, 8, 0, 0]} />
        <Bar dataKey="ok" fill="#10b981" name="OK" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
