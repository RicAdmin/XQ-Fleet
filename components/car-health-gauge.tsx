"use client"

import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

export function CarHealthGauge({ score }: { score: number }) {
  const data = [
    { name: "Score", value: score },
    { name: "Remaining", value: 100 - score },
  ]

  const getColor = (score: number) => {
    if (score >= 80) return "#10b981" // green
    if (score >= 60) return "#f59e0b" // amber
    return "#ef4444" // red
  }

  const color = getColor(score)

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            startAngle={180}
            endAngle={0}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={0}
            dataKey="value"
          >
            <Cell fill={color} />
            <Cell fill="#1f2937" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold" style={{ color }}>
          {score}%
        </span>
        <span className="text-sm text-muted-foreground">Health Score</span>
      </div>
    </div>
  )
}
