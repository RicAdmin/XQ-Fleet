"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { MapPin } from "lucide-react"

// Mock data for location statistics
const locationData = [
  {
    location: "KLIA",
    totalCars: 12,
    pickups: 45,
    returns: 42,
    percentage: 30,
  },
  {
    location: "Subang",
    totalCars: 8,
    pickups: 32,
    returns: 35,
    percentage: 20,
  },
  {
    location: "Penang",
    totalCars: 10,
    pickups: 38,
    returns: 36,
    percentage: 25,
  },
  {
    location: "JB",
    totalCars: 6,
    pickups: 25,
    returns: 28,
    percentage: 15,
  },
  {
    location: "Ipoh",
    totalCars: 4,
    pickups: 15,
    returns: 14,
    percentage: 10,
  },
]

const COLORS = ["#2663EB", "#FF8945", "#10b981", "#f59e0b", "#8b5cf6"]

export function LocationStatsChart() {
  return (
    <Card className="rounded-xl glass-card border-white/40">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-[#2663EB]" />
          <CardTitle className="text-sm font-medium">
            Fleet Distribution by Pickup Location and Return Location
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Location breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {locationData.map((loc, index) => (
              <div key={loc.location} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{loc.location}</span>
                  <span className="text-xs font-semibold text-muted-foreground">{loc.percentage}%</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Cars:</span>
                    <span className="font-semibold">{loc.totalCars}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Pickups:</span>
                    <span className="font-semibold text-green-600">{loc.pickups}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Returns:</span>
                    <span className="font-semibold text-blue-600">{loc.returns}</span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${loc.percentage}%`,
                      backgroundColor: COLORS[index],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="h-[250px] mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={locationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="location" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="pickups" name="Pickups" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="returns" name="Returns" fill="#2663EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
