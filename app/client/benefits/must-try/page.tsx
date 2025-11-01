"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Map, Clock, MapPin, Utensils, Camera, ShoppingBag, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function MustTryPage() {
  const routes = [
    {
      name: "Coastal Drive",
      duration: "4-6 hours",
      distance: "180 km",
      highlights: ["Beach views", "Seafood restaurants", "Sunset spots"],
    },
    {
      name: "Highland Adventure",
      duration: "6-8 hours",
      distance: "220 km",
      highlights: ["Tea plantations", "Cool weather", "Strawberry farms"],
    },
    {
      name: "City Explorer",
      duration: "2-3 hours",
      distance: "45 km",
      highlights: ["Shopping malls", "Street food", "Cultural sites"],
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-2xl mx-auto px-5 py-4">
          <div className="flex items-center gap-3">
            <Link href="/client">
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Map className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-foreground">Must-Try Routes</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6 space-y-5">
        <Card className="glass-card border-white/40 p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Popular Routes</h2>
          <div className="space-y-4">
            {routes.map((route) => (
              <div key={route.name} className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-foreground text-lg">{route.name}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {route.duration}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {route.distance}
                      </div>
                    </div>
                  </div>
                  <Button size="sm">View Map</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {route.highlights.map((highlight) => (
                    <Badge key={highlight} variant="outline" className="text-xs">
                      {highlight}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass-card border-white/40 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Utensils className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Where to Eat</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Discover local favorites and hidden gems along your route
          </p>
          <Button variant="outline" className="w-full h-12 bg-transparent">
            Browse Restaurants
          </Button>
        </Card>

        <Card className="glass-card border-white/40 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Camera className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Must-See Attractions</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Photo spots and landmarks you shouldn't miss</p>
          <Button variant="outline" className="w-full h-12 bg-transparent">
            View Attractions
          </Button>
        </Card>

        <Card className="glass-card border-white/40 p-6">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Shopping & Souvenirs</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Local markets and specialty shops worth visiting</p>
          <Button variant="outline" className="w-full h-12 bg-transparent">
            Explore Shopping
          </Button>
        </Card>
      </div>
    </div>
  )
}
