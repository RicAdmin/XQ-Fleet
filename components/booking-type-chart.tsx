"use client"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

const bookingTypeData = [
  { name: "Daily Rental", value: 145, color: "#FF8945" },
  { name: "Weekly Rental", value: 89, color: "#2663EB" },
  { name: "Monthly Rental", value: 34, color: "#10B981" },
  { name: "Corporate", value: 67, color: "#8B5CF6" },
  { name: "Personal", value: 198, color: "#F59E0B" },
]

const COLORS = bookingTypeData.map((item) => item.color)

export function BookingTypeChart() {
  const total = bookingTypeData.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={bookingTypeData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {bookingTypeData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0]
                const percentage = (((data.value as number) / total) * 100).toFixed(1)
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: data.payload.color }} />
                      <span className="font-semibold text-sm">{data.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div>Jobs: {data.value}</div>
                      <div>Percentage: {percentage}%</div>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {bookingTypeData.map((item) => (
          <div
            key={item.name}
            className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
            <div className="text-center">
              <p className="text-xs font-medium text-muted-foreground truncate w-full">{item.name}</p>
              <p className="text-lg font-bold text-foreground">{item.value}</p>
              <p className="text-xs text-muted-foreground">{((item.value / total) * 100).toFixed(1)}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
