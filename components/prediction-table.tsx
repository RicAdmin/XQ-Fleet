"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Wrench } from "lucide-react"
import Image from "next/image"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Link from "next/link"

const predictions = [
  {
    id: "1",
    car: "Toyota Camry",
    registration: "WKL 1234",
    image: "/toyota-camry-sedan.png",
    lastMaintenance: "2024-11-15",
    odometer: 87500,
    kmSinceService: 12500,
    predictedDue: "2025-01-20",
    confidence: 92,
    status: "urgent",
    reason: "High mileage since last service",
  },
  {
    id: "2",
    car: "Honda Odyssey",
    registration: "WKL 5678",
    image: "/honda-odyssey-mpv.jpg",
    lastMaintenance: "2024-12-01",
    odometer: 65000,
    kmSinceService: 8000,
    predictedDue: "2025-02-15",
    confidence: 85,
    status: "due-soon",
    reason: "Approaching service interval",
  },
  {
    id: "3",
    car: "Ford Explorer",
    registration: "WKL 9012",
    image: "/ford-explorer-suv.jpg",
    lastMaintenance: "2024-10-20",
    odometer: 95000,
    kmSinceService: 15000,
    predictedDue: "2025-01-10",
    confidence: 95,
    status: "urgent",
    reason: "Exceeded recommended service interval",
  },
  {
    id: "4",
    car: "Nissan Altima",
    registration: "WKL 3456",
    image: "/nissan-altima-sedan.jpg",
    lastMaintenance: "2024-12-20",
    odometer: 42000,
    kmSinceService: 3000,
    predictedDue: "2025-04-15",
    confidence: 78,
    status: "ok",
    reason: "Recently serviced",
  },
  {
    id: "5",
    car: "Chevrolet Tahoe",
    registration: "WKL 7890",
    image: "/chevrolet-tahoe-suv.jpg",
    lastMaintenance: "2024-11-10",
    odometer: 78000,
    kmSinceService: 13000,
    predictedDue: "2025-01-25",
    confidence: 88,
    status: "urgent",
    reason: "High usage pattern detected",
  },
]

export function PredictionTable() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "urgent":
        return <Badge className="bg-red-500 hover:bg-red-600">Urgent</Badge>
      case "due-soon":
        return <Badge className="bg-amber-500 hover:bg-amber-600">Due Soon</Badge>
      case "ok":
        return <Badge className="bg-green-500 hover:bg-green-600">OK</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <TooltipProvider>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Car</TableHead>
              <TableHead>Last Maintenance</TableHead>
              <TableHead>Odometer (km)</TableHead>
              <TableHead>KM Since Service</TableHead>
              <TableHead>Predicted Due Date</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {predictions.map((prediction, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Image
                      src={prediction.image || "/placeholder.svg"}
                      alt={prediction.car}
                      width={48}
                      height={48}
                      className="rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-medium">{prediction.car}</p>
                      <p className="text-sm text-muted-foreground">{prediction.registration}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{prediction.lastMaintenance}</TableCell>
                <TableCell>{prediction.odometer.toLocaleString()}</TableCell>
                <TableCell>{prediction.kmSinceService.toLocaleString()}</TableCell>
                <TableCell>{prediction.predictedDue}</TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help font-medium">{prediction.confidence}%</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-sm">{prediction.reason}</p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>{getStatusBadge(prediction.status)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Link href={`/car-health/${prediction.id}`}>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </Link>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Wrench className="h-4 w-4 mr-1" />
                      Create Task
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  )
}
