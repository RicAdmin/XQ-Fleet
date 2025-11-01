"use client"

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

const data = [
  { month: "Jul", score: 85 },
  { month: "Aug", score: 82 },
  { month: "Sep", score: 78 },
  { month: "Oct", score: 75 },
  { month: "Nov", score: 71 },
  { month: "Dec", score: 68 },
]

export function HealthTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
        <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 100]} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "8px",
          }}
        />
        <Line type="monotone" dataKey="score" stroke="#14b8a6" strokeWidth={2} dot={{ fill: "#14b8a6" }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
