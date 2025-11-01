"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Gift, Star, Users, MessageSquare, ArrowLeft, Trophy, Sparkles } from "lucide-react"
import Link from "next/link"

export default function RewardsPage() {
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
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Gift className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-foreground">Rewards Program</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6 space-y-5">
        <Card className="glass-card border-white/40 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">Your Points</h2>
              <p className="text-sm text-muted-foreground">Earn rewards with every rental</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary">1,250</div>
              <Badge className="mt-2 bg-amber-500/10 text-amber-700 border-amber-500/20">Gold Tier</Badge>
            </div>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 w-3/4" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">750 points to Platinum tier</p>
        </Card>

        <Card className="glass-card border-white/40 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Membership Tiers</h3>
          </div>
          <div className="space-y-3">
            {[
              { name: "Silver", points: "0-500", discount: "5%", color: "bg-gray-400" },
              { name: "Gold", points: "501-2000", discount: "10%", color: "bg-amber-500" },
              { name: "Platinum", points: "2001+", discount: "15%", color: "bg-purple-500" },
            ].map((tier) => (
              <div key={tier.name} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30">
                <div className={`h-12 w-12 rounded-full ${tier.color} flex items-center justify-center`}>
                  <Star className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-foreground">{tier.name}</div>
                  <div className="text-sm text-muted-foreground">{tier.points} points</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">{tier.discount}</div>
                  <div className="text-xs text-muted-foreground">discount</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass-card border-white/40 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Referral Program</h3>
          </div>
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-5 mb-4">
            <div className="text-sm text-muted-foreground mb-2">Your Referral Code</div>
            <div className="flex items-center gap-3">
              <code className="flex-1 text-2xl font-bold font-mono text-foreground">XQ2025JS</code>
              <Button size="sm" className="h-10">
                Copy
              </Button>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold text-foreground">Earn 200 points</div>
                <div className="text-sm text-muted-foreground">When your friend completes their first rental</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold text-foreground">Friend gets 10% off</div>
                <div className="text-sm text-muted-foreground">On their first rental with your code</div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="glass-card border-white/40 p-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Review Bonus</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Share your experience and earn 50 points for each verified review
          </p>
          <Button className="w-full h-12 bg-gradient-to-r from-primary to-primary/90">Write a Review</Button>
        </Card>
      </div>
    </div>
  )
}
