"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Eye } from "lucide-react"
import Link from "next/link"
import { fleetCars } from "@/lib/fleet-data"
import { AddCarModal } from "@/components/add-car-modal"

type CarStatus =
  | "Available 可用"
  | "Reserved 已预订"
  | "Rented 在租"
  | "Due Back 到期待还"
  | "Overdue 逾期未还"
  | "Returned 已归还"
  | "Cleaning 清洁中"
  | "Inspection 质检中"
  | "Maintenance 维修中"
  | "Off Fleet 暂离车队"
type CarCategory = "Sedan" | "MPV" | "SUV" | "Hatchback" | "Convertible"

interface Car {
  id: string
  registrationNo: string
  make: string
  model: string
  category: CarCategory
  status: CarStatus
  lastReturnDate: string
  photo: string
  location: string
  joinedDate: string
}

const mockCars: Car[] = fleetCars.flatMap((fleetCar, index) => {
  const locations = ["Kuala Lumpur", "Penang", "Johor Bahru", "Ipoh", "Melaka"]
  return Array.from({ length: fleetCar.units }, (_, unitIndex) => ({
    id: `${index}-${unitIndex}`,
    registrationNo: `${fleetCar.brand.substring(0, 3).toUpperCase()}-${1000 + index * 100 + unitIndex}`,
    make: fleetCar.brand,
    model: fleetCar.model,
    category: fleetCar.category,
    status: ["Available 可用", "Rented 在租", "Maintenance 维修中", "Cleaning 清洁中"][
      Math.floor(Math.random() * 4)
    ] as CarStatus,
    lastReturnDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    photo: fleetCar.image,
    location: locations[Math.floor(Math.random() * locations.length)],
    joinedDate: new Date(2023, Math.floor(Math.random() * 12), 1).toISOString(),
  }))
})

const statusColors: Record<CarStatus, string> = {
  "Available 可用": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  "Reserved 已预订": "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  "Rented 在租": "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  "Due Back 到期待还": "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  "Overdue 逾期未还": "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  "Returned 已归还": "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  "Cleaning 清洁中": "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20",
  "Inspection 质检中": "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  "Maintenance 维修中": "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  "Off Fleet 暂离车队": "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
}

function calculateIdleDays(lastReturnDate: string): number {
  const returnDate = new Date(lastReturnDate)
  const today = new Date()
  const diffTime = Math.abs(today.getTime() - returnDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

function formatJoinedDate(dateString: string): string {
  const date = new Date(dateString)
  const month = date.toLocaleString("en-US", { month: "short" })
  const year = date.getFullYear()
  return `${month} ${year}`
}

export function FleetManagement() {
  const [cars, setCars] = useState<Car[]>(mockCars)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const filteredCars = cars.filter((car) => {
    const matchesSearch =
      car.registrationNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.make.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || car.status === statusFilter
    const matchesCategory = categoryFilter === "all" || car.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  const handleAddCar = (newCar: Omit<Car, "id">) => {
    const car: Car = {
      ...newCar,
      id: String(cars.length + 1),
    }
    setCars([...cars, car])
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 pb-24 lg:pb-6">
      {/* Filters and Actions Bar */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by registration or model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-10">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Available 可用">Available 可用</SelectItem>
                <SelectItem value="Rented 在租">Rented 在租</SelectItem>
                <SelectItem value="Maintenance 维修中">Maintenance 维修中</SelectItem>
                <SelectItem value="Cleaning 清洁中">Cleaning 清洁中</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-10">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Sedan">Sedan</SelectItem>
                <SelectItem value="MPV">MPV</SelectItem>
                <SelectItem value="SUV">SUV</SelectItem>
                <SelectItem value="Hatchback">Hatchback</SelectItem>
                <SelectItem value="Convertible">Convertible</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Add Car Button */}
          <Button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto h-10 shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Car
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div>
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredCars.length}</span> of{" "}
          <span className="font-semibold text-foreground">{cars.length}</span> vehicles
        </p>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[80px]">Photo</TableHead>
                <TableHead>Brand | Model</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Idle Days</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCars.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No vehicles found matching your filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredCars.map((car) => {
                  const idleDays = calculateIdleDays(car.lastReturnDate)
                  const joinedDate = formatJoinedDate(car.joinedDate)

                  return (
                    <TableRow key={car.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="w-20 h-11 rounded-lg overflow-hidden border border-border bg-muted">
                          <img
                            src={car.photo || "/placeholder.svg"}
                            alt={`${car.make} ${car.model}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-sm">{car.make}</div>
                        <div className="text-xs text-muted-foreground">{car.model}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-medium text-xs">
                          {car.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{joinedDate}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold">{idleDays}</span>
                          <span className="text-xs text-muted-foreground">days</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{car.location}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/car/${car.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View details</span>
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Car Modal */}
      <AddCarModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} onAddCar={handleAddCar} />
    </div>
  )
}
