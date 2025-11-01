"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Car, Search, MapPin, Eye, Calendar, Clock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"

export function CarListView() {
  const [selectedLocation, setSelectedLocation] = useState<string>("all")

  const locations = [
    {
      name: "Airport Gate",
      cars: [
        {
          id: "1",
          plate: "AX1234",
          model: "Toyota Camry",
          category: "Sedan",
          status: "Available",
          image: "/toyota-camry-sedan.png",
          passengers: 5,
          nextJob: {
            date: "2025-01-12",
            time: "14:00",
            customer: "John Doe",
          },
        },
        {
          id: "2",
          plate: "BX5678",
          model: "Ford Explorer",
          category: "SUV",
          status: "Rented",
          image: "/ford-explorer-suv.jpg",
          passengers: 7,
        },
      ],
    },
    {
      name: "Jetty",
      cars: [
        {
          id: "3",
          plate: "CX9012",
          model: "Honda Odyssey",
          category: "MPV",
          status: "Available",
          image: "/honda-odyssey-mpv.jpg",
          passengers: 7,
          nextJob: {
            date: "2025-01-11",
            time: "09:00",
            customer: "Sarah Lee",
          },
        },
      ],
    },
    {
      name: "Kuah CP",
      cars: [
        {
          id: "4",
          plate: "DX3456",
          model: "Nissan Altima",
          category: "Sedan",
          status: "Maintenance",
          image: "/nissan-altima-sedan.jpg",
          passengers: 5,
        },
      ],
    },
    {
      name: "Airport CP",
      cars: [
        {
          id: "5",
          plate: "EX7890",
          model: "Chevrolet Tahoe",
          category: "SUV",
          status: "Available",
          image: "/chevrolet-tahoe-suv.jpg",
          passengers: 7,
        },
      ],
    },
  ]

  const filteredLocations =
    selectedLocation === "all" ? locations : locations.filter((loc) => loc.name === selectedLocation)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
      case "Rented":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
      case "Maintenance":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
      case "Car Wash":
        return "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20"
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow"
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 pb-24 lg:pb-6">
      {/* Filters */}
      <Card className="rounded-xl p-4 shadow-sm border-border/50">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by plate number or model..." className="pl-10 h-11" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.name} value={location.name}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="sedan">Sedan</SelectItem>
                <SelectItem value="suv">SUV</SelectItem>
                <SelectItem value="mpv">MPV</SelectItem>
                <SelectItem value="compact">Compact</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="rented">Rented</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="wash">Car Wash</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {filteredLocations.map((location) => (
          <Card key={location.name} className="rounded-xl shadow-sm border-border/50 overflow-hidden">
            <div className="border-b border-border bg-muted/30 py-3 px-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                <h3 className="text-sm sm:text-base font-semibold tracking-tight">{location.name}</h3>
                <Badge variant="outline" className="ml-auto text-xs font-medium">
                  {location.cars.length} {location.cars.length === 1 ? "car" : "cars"}
                </Badge>
              </div>
            </div>
            <CardContent className="p-0">
              <div className="overflow-x-auto scrollbar-thin">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/50">
                      <TableHead className="w-[80px] sm:w-[100px]">Image</TableHead>
                      <TableHead className="sticky left-[80px] sm:left-[100px] bg-background z-10">Vehicle</TableHead>
                      <TableHead className="hidden sm:table-cell">Plate</TableHead>
                      <TableHead className="hidden md:table-cell">Category</TableHead>
                      <TableHead className="text-center hidden lg:table-cell">Passengers</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden xl:table-cell">Next Job</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {location.cars.map((car) => (
                      <TableRow key={car.id} className="hover:bg-muted/50 border-border/50">
                        <TableCell>
                          <div className="relative h-12 w-20 sm:h-14 sm:w-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            <Image
                              src={car.image || "/placeholder.svg"}
                              alt={car.model}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="sticky left-[80px] sm:left-[100px] bg-background z-10">
                          <div className="font-medium text-xs sm:text-sm">{car.model}</div>
                          <div className="flex items-center gap-1.5 text-xs sm:hidden mt-1">
                            <Car className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span>{car.plate}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                            <Car className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span>{car.plate}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-xs sm:text-sm text-muted-foreground">{car.category}</span>
                        </TableCell>
                        <TableCell className="text-center hidden lg:table-cell">
                          <span className="text-xs sm:text-sm">{car.passengers}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${getStatusColor(car.status)}`}>{car.status}</Badge>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          {car.status === "Available" && car.nextJob ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 text-xs font-medium text-[#FF8945]">
                                <Clock className="h-3 w-3 flex-shrink-0" />
                                <span>{formatDate(car.nextJob.date)}</span>
                                <span className="text-muted-foreground">at</span>
                                <span>{car.nextJob.time}</span>
                              </div>
                              <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                                {car.nextJob.customer}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 sm:gap-2">
                            <Link href={`/car/${car.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9 sm:h-10 text-xs bg-transparent hover:bg-[#13116A] hover:text-white px-2 sm:px-3"
                              >
                                <Eye className="h-3 w-3 sm:mr-1.5" />
                                <span className="hidden sm:inline">View</span>
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 w-9 sm:h-10 sm:w-10 p-0 bg-transparent hover:bg-[#13116A] hover:text-white"
                            >
                              <Calendar className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
