"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"

const topIdleCars = [
  {
    id: 1,
    car: "Mini Convertible",
    registration: "MIN-9999",
    image: "/classic-red-convertible.png",
    idleDays: 45,
    lastReturnDate: "2024-11-25",
    status: "Available",
  },
  {
    id: 2,
    car: "Chevrolet Tahoe",
    registration: "JKL-7890",
    image: "/chevrolet-tahoe-suv.jpg",
    idleDays: 38,
    lastReturnDate: "2024-12-02",
    status: "Available",
  },
  {
    id: 3,
    car: "Suzuki Jimny",
    registration: "YZA-8901",
    image: "/suzuki-jimny.png",
    idleDays: 32,
    lastReturnDate: "2024-12-08",
    status: "Available",
  },
  {
    id: 4,
    car: "Ford Explorer",
    registration: "DEF-9012",
    image: "/ford-explorer-suv.jpg",
    idleDays: 28,
    lastReturnDate: "2024-12-12",
    status: "Available",
  },
  {
    id: 5,
    car: "Toyota Veloz",
    registration: "VEL-5555",
    image: "/toyota-veloz.png",
    idleDays: 25,
    lastReturnDate: "2024-12-15",
    status: "Available",
  },
  {
    id: 6,
    car: "Perodua Bezza",
    registration: "BEZ-3333",
    image: "/perodua-bezza.png",
    idleDays: 22,
    lastReturnDate: "2024-12-18",
    status: "Available",
  },
  {
    id: 7,
    car: "Toyota Innova",
    registration: "INN-7777",
    image: "/toyota-innova.png",
    idleDays: 19,
    lastReturnDate: "2024-12-21",
    status: "Available",
  },
  {
    id: 8,
    car: "Nissan Altima",
    registration: "GHI-3456",
    image: "/nissan-altima-sedan.jpg",
    idleDays: 16,
    lastReturnDate: "2024-12-24",
    status: "Available",
  },
  {
    id: 9,
    car: "Perodua Axia",
    registration: "VWX-4567",
    image: "/perodua-axia.png",
    idleDays: 13,
    lastReturnDate: "2024-12-27",
    status: "Available",
  },
  {
    id: 10,
    car: "Toyota Vios",
    registration: "MNO-2345",
    image: "/toyota-vios-3g-facelift.png",
    idleDays: 10,
    lastReturnDate: "2024-12-30",
    status: "Available",
  },
]

export function TopIdleCarsTable() {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Car</TableHead>
            <TableHead className="text-right">Idle Days</TableHead>
            <TableHead className="text-right">Last Return Date</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topIdleCars.map((car) => (
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
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <span className="font-semibold text-orange-600 dark:text-orange-400">{car.idleDays} days</span>
                </div>
              </TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">{car.lastReturnDate}</TableCell>
              <TableCell className="text-right">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {car.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
