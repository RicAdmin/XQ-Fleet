"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Fuel, Gauge, Usb, MapPin, ArrowLeft, Info } from "lucide-react"
import Link from "next/link"

export default function EssentialsPage() {
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
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Fuel className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-foreground">Vehicle Essentials</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6 space-y-5">
        <Card className="glass-card border-white/40 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Fuel className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Fuel Information</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Fuel Type</span>
                <Badge variant="outline">RON 95</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tank Capacity</span>
                <span className="font-semibold text-foreground">50 Liters</span>
              </div>
            </div>
            <Button className="w-full h-12 bg-gradient-to-r from-primary to-primary/90">
              <MapPin className="h-5 w-5 mr-2" />
              Find Nearest Fuel Station
            </Button>
          </div>
        </Card>

        <Card className="glass-card border-white/40 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Gauge className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Tyre Pressure</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-muted/30 text-center">
              <div className="text-sm text-muted-foreground mb-2">Front Tyres</div>
              <div className="text-3xl font-bold text-foreground">32</div>
              <div className="text-xs text-muted-foreground mt-1">PSI</div>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 text-center">
              <div className="text-sm text-muted-foreground mb-2">Rear Tyres</div>
              <div className="text-3xl font-bold text-foreground">32</div>
              <div className="text-xs text-muted-foreground mt-1">PSI</div>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex gap-2">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-900 dark:text-blue-100">
                Check tyre pressure when tyres are cold for accurate readings
              </p>
            </div>
          </div>
        </Card>

        <Card className="glass-card border-white/40 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Usb className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Charging Ports</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
              <div>
                <div className="font-semibold text-foreground">Front Console</div>
                <div className="text-sm text-muted-foreground">2x USB-A, 1x USB-C</div>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                Available
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
              <div>
                <div className="font-semibold text-foreground">Rear Seats</div>
                <div className="text-sm text-muted-foreground">2x USB-A</div>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                Available
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="glass-card border-white/40 p-6">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Nearby Services</h3>
          </div>
          <div className="space-y-2">
            <Button variant="outline" className="w-full h-12 justify-start bg-transparent">
              <Fuel className="h-5 w-5 mr-3" />
              Petrol Stations
            </Button>
            <Button variant="outline" className="w-full h-12 justify-start bg-transparent">
              <Gauge className="h-5 w-5 mr-3" />
              Tyre Services
            </Button>
            <Button variant="outline" className="w-full h-12 justify-start bg-transparent">
              <MapPin className="h-5 w-5 mr-3" />
              Car Wash
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
