import { Card, CardContent } from "@/components/ui/card"
import { Car, KeyRound, Wrench, Droplets } from "lucide-react"

export function SummaryCards() {
  const cards = [
    {
      title: "Total Cars",
      value: "48",
      icon: Car,
      change: "+2 this month",
      color: "text-chart-1",
    },
    {
      title: "Currently Rented",
      value: "32",
      icon: KeyRound,
      change: "67% occupancy",
      color: "text-chart-2",
    },
    {
      title: "Under Maintenance",
      value: "5",
      icon: Wrench,
      change: "10% of fleet",
      color: "text-chart-3",
    },
    {
      title: "Due for Wash",
      value: "8",
      icon: Droplets,
      change: "Scheduled today",
      color: "text-chart-4",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className="text-3xl font-bold text-foreground">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.change}</p>
              </div>
              <div className={`rounded-full bg-muted p-3 ${card.color}`}>
                <card.icon className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
