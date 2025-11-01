"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Activity, Eye, TrendingUp, TrendingDown } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export function CarHealthList() {
  const cars = [
    {
      id: "1",
      plate: "AX1234",
      model: "Toyota Camry",
      healthScore: 92,
      trend: "up",
      image: "/toyota-camry-sedan.png",
    },
    {
      id: "2",
      plate: "BX5678",
      model: "Ford Explorer",
      healthScore: 78,
      trend: "down",
      image: "/ford-explorer-suv.jpg",
    },
    {
      id: "3",
      plate: "CX9012",
      model: "Honda Odyssey",
      healthScore: 85,
      trend: "up",
      image: "/honda-odyssey-mpv.jpg",
    },
  ]

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-orange-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Car Health Overview</h1>
        <p className="text-muted-foreground">Monitor health scores and predictive maintenance</p>
      </div>

      {/* Car Health Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cars.map((car) => (
          <Card key={car.id} className="rounded-2xl shadow-md hover:shadow-lg transition-shadow">
            <div className="relative h-48 bg-muted">
              <Image
                src={car.image || "/placeholder.svg"}
                alt={car.model}
                fill
                className="object-cover rounded-t-2xl"
              />
            </div>
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{car.model}</h3>
                <p className="text-sm text-muted-foreground">{car.plate}</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Health Score</p>
                  <div className="flex items-center gap-2">
                    <p className={`text-3xl font-bold ${getHealthColor(car.healthScore)}`}>{car.healthScore}</p>
                    {car.trend === "up" ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </div>
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Activity className="h-8 w-8 text-primary" />
                </div>
              </div>
              <Link href={`/car-health/${car.id}`}>
                <Button variant="outline" className="w-full bg-transparent">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
