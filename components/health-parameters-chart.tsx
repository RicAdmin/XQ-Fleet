"use client"

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

const data = [
  { parameter: "Mileage", impact: 85 },
  { parameter: "Time Since Service", impact: 72 },
  { parameter: "Usage Intensity", impact: 68 },
  { parameter: "Maintenance Cost", impact: 55 },
  { parameter: "Booking Frequency", impact: 45 },
]

export function HealthParametersChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis type="number" stroke="#9ca3af" fontSize={12} domain={[0, 100]} />
        <YAxis type="category" dataKey="parameter" stroke="#9ca3af" fontSize={12} width={120} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "8px",
          }}
        />
        <Bar dataKey="impact" fill="#3b82f6" radius={[0, 8, 8, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
