"use client"

import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

const data = [
  { month: "Jul", camry: 75000, odyssey: 57000, explorer: 80000, altima: 39000, tahoe: 65000 },
  { month: "Aug", camry: 78500, odyssey: 59500, explorer: 83500, altima: 40000, tahoe: 68500 },
  { month: "Sep", camry: 81000, odyssey: 61000, explorer: 87500, altima: 40500, tahoe: 71000 },
  { month: "Oct", camry: 83500, odyssey: 62500, explorer: 91000, altima: 41000, tahoe: 73500 },
  { month: "Nov", camry: 85500, odyssey: 64000, explorer: 93500, altima: 41500, tahoe: 76500 },
  { month: "Dec", camry: 87500, odyssey: 65000, explorer: 95000, altima: 42000, tahoe: 78000 },
]

export function OdometerChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="month" className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
        />
        <Legend />
        <Line type="monotone" dataKey="camry" stroke="#3b82f6" strokeWidth={2} name="Toyota Camry" />
        <Line type="monotone" dataKey="odyssey" stroke="#10b981" strokeWidth={2} name="Honda Odyssey" />
        <Line type="monotone" dataKey="explorer" stroke="#f59e0b" strokeWidth={2} name="Ford Explorer" />
        <Line type="monotone" dataKey="altima" stroke="#8b5cf6" strokeWidth={2} name="Nissan Altima" />
        <Line type="monotone" dataKey="tahoe" stroke="#ec4899" strokeWidth={2} name="Chevrolet Tahoe" />
      </LineChart>
    </ResponsiveContainer>
  )
}
