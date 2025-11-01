import { Badge } from "@/components/ui/badge"

const activities = [
  {
    id: 1,
    type: "Booking",
    vehicle: "Toyota Camry",
    customer: "Ahmad Hassan",
    time: "2 hours ago",
    status: "completed",
  },
  {
    id: 2,
    type: "Maintenance",
    vehicle: "Honda Odyssey",
    customer: "Service Center",
    time: "4 hours ago",
    status: "in-progress",
  },
  {
    id: 3,
    type: "Wash",
    vehicle: "Ford Explorer",
    customer: "Car Wash Station",
    time: "5 hours ago",
    status: "completed",
  },
  {
    id: 4,
    type: "Booking",
    vehicle: "Nissan Altima",
    customer: "Sarah Lee",
    time: "6 hours ago",
    status: "completed",
  },
]

export function RecentActivityTable() {
  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{activity.type}</span>
              <Badge variant={activity.status === "completed" ? "default" : "secondary"} className="text-xs">
                {activity.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {activity.vehicle} • {activity.customer}
            </p>
          </div>
          <span className="text-xs text-muted-foreground">{activity.time}</span>
        </div>
      ))}
    </div>
  )
}
