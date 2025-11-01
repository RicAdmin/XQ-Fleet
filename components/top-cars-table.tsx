"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Image from "next/image"

const topCars = [
  {
    id: 1,
    car: "Toyota Camry",
    registration: "WXY-1234",
    image: "/toyota-camry-sedan.png",
    totalDaysRented: 285,
    utilizationRate: 88.5,
    revenue: 28500,
  },
  {
    id: 2,
    car: "Honda Odyssey",
    registration: "ABC-5678",
    image: "/honda-odyssey-mpv.jpg",
    totalDaysRented: 268,
    utilizationRate: 83.2,
    revenue: 26800,
  },
  {
    id: 3,
    car: "Ford Explorer",
    registration: "DEF-9012",
    image: "/ford-explorer-suv.jpg",
    totalDaysRented: 245,
    utilizationRate: 76.1,
    revenue: 24500,
  },
  {
    id: 4,
    car: "Nissan Altima",
    registration: "GHI-3456",
    image: "/nissan-altima-sedan.jpg",
    totalDaysRented: 232,
    utilizationRate: 72.0,
    revenue: 23200,
  },
  {
    id: 5,
    car: "Chevrolet Tahoe",
    registration: "JKL-7890",
    image: "/chevrolet-tahoe-suv.jpg",
    totalDaysRented: 218,
    utilizationRate: 67.7,
    revenue: 21800,
  },
  {
    id: 6,
    car: "Toyota Vios",
    registration: "MNO-2345",
    image: "/toyota-vios-3g-facelift.png",
    totalDaysRented: 205,
    utilizationRate: 63.7,
    revenue: 20500,
  },
  {
    id: 7,
    car: "Perodua Alza",
    registration: "PQR-6789",
    image: "/perodua-alza.png",
    totalDaysRented: 192,
    utilizationRate: 59.6,
    revenue: 19200,
  },
  {
    id: 8,
    car: "Toyota Avanza",
    registration: "STU-0123",
    image: "/toyota-avanza.png",
    totalDaysRented: 178,
    utilizationRate: 55.3,
    revenue: 17800,
  },
  {
    id: 9,
    car: "Perodua Axia",
    registration: "VWX-4567",
    image: "/perodua-axia.png",
    totalDaysRented: 165,
    utilizationRate: 51.2,
    revenue: 16500,
  },
  {
    id: 10,
    car: "Suzuki Jimny",
    registration: "YZA-8901",
    image: "/suzuki-jimny.png",
    totalDaysRented: 152,
    utilizationRate: 47.2,
    revenue: 15200,
  },
]

export function TopCarsTable() {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Car</TableHead>
            <TableHead className="text-right">Total Days Rented</TableHead>
            <TableHead className="text-right">Utilization %</TableHead>
            <TableHead className="text-right">Revenue Generated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topCars.map((car) => (
            <TableRow key={car.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-16 overflow-hidden rounded-lg">
                    <Image src={car.image || "/placeholder.svg"} alt={car.car} fill className="object-cover" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{car.car}</p>
                    <p className="text-sm text-muted-foreground">{car.registration}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">{car.totalDaysRented} days</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-teal-500"
                      style={{ width: `${car.utilizationRate}%` }}
                    />
                  </div>
                  <span className="font-medium">{car.utilizationRate}%</span>
                </div>
              </TableCell>
              <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                ${car.revenue.toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
