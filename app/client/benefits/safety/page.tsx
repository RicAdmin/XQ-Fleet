"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Phone, AlertTriangle, Wrench, Droplets, ArrowLeft, FileText } from "lucide-react"
import Link from "next/link"

export default function SafetyPage() {
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
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-foreground">Safety & Support</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6 space-y-5">
        <Card className="glass-card border-red-500/20 p-6 bg-red-500/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-red-500 flex items-center justify-center">
              <Phone className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Emergency SOS</h3>
              <p className="text-sm text-muted-foreground">24/7 Emergency Hotline</p>
            </div>
          </div>
          <Button className="w-full h-14 bg-red-500 hover:bg-red-600 text-white text-lg font-bold">
            <Phone className="h-6 w-6 mr-2" />
            Call Emergency: 999
          </Button>
        </Card>

        <Card className="glass-card border-white/40 p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
            <h3 className="text-lg font-bold text-foreground">Accident Guide</h3>
          </div>
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-muted/30">
              <div className="font-semibold text-foreground mb-2">1. Ensure Safety</div>
              <p className="text-sm text-muted-foreground">Move to a safe location and turn on hazard lights</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30">
              <div className="font-semibold text-foreground mb-2">2. Call Emergency Services</div>
              <p className="text-sm text-muted-foreground">Dial 999 for police and ambulance if needed</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30">
              <div className="font-semibold text-foreground mb-2">3. Document the Scene</div>
              <p className="text-sm text-muted-foreground">Take photos and exchange information with other parties</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30">
              <div className="font-semibold text-foreground mb-2">4. Contact Us</div>
              <p className="text-sm text-muted-foreground">Report the incident through the support ticket system</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card border-white/40 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Wrench className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Roadside Assistance</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            24/7 support for breakdowns, flat tyres, and battery issues
          </p>
          <Button className="w-full h-12 bg-gradient-to-r from-primary to-primary/90">
            <Phone className="h-5 w-5 mr-2" />
            Call Roadside Assist
          </Button>
        </Card>

        <Card className="glass-card border-white/40 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Droplets className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-bold text-foreground">Flood Safety Tips</h3>
          </div>
          <div className="space-y-3">
            <div className="flex gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-foreground text-sm mb-1">Never drive through flooded areas</div>
                <p className="text-xs text-muted-foreground">Even shallow water can cause serious damage</p>
              </div>
            </div>
            <div className="flex gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-foreground text-sm mb-1">Turn around, don't drown</div>
                <p className="text-xs text-muted-foreground">Find an alternative route if water is present</p>
              </div>
            </div>
            <div className="flex gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-foreground text-sm mb-1">If stalled in water</div>
                <p className="text-xs text-muted-foreground">
                  Do not restart the engine. Exit safely and call for help
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="glass-card border-white/40 p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Insurance Information</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">View your coverage details and policy documents</p>
          <Button variant="outline" className="w-full h-12 bg-transparent">
            View Insurance Policy
          </Button>
        </Card>
      </div>
    </div>
  )
}
