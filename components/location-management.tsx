"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Edit, Eye, MapPin, Car, CarFront, Building2, ArrowRightLeft } from "lucide-react"
import { LocationDetailModal } from "@/components/location-detail-modal"
import { AddLocationModal } from "@/components/add-location-modal"
import { TransferCarsModal } from "@/components/transfer-cars-modal"

interface Location {
  id: string
  name: string
  address: string
  totalCars: number
  availableCars: number
  maintenanceCars: number
  washCars: number
  manager: string
  contact: string
}

const mockLocations: Location[] = [
  {
    id: "1",
    name: "Airport CP",
    address: "Langkawi International Airport, Terminal Building",
    totalCars: 25,
    availableCars: 12,
    maintenanceCars: 2,
    washCars: 1,
    manager: "Ahmad Hassan",
    contact: "+60 12-345 6789",
  },
  {
    id: "2",
    name: "Jetty CP",
    address: "Kuah Jetty, Passenger Terminal",
    totalCars: 18,
    availableCars: 8,
    maintenanceCars: 1,
    washCars: 2,
    manager: "Siti Nurhaliza",
    contact: "+60 12-456 7890",
  },
  {
    id: "3",
    name: "Kuah CP",
    address: "Jalan Pandak Mayah 1, Kuah Town",
    totalCars: 32,
    availableCars: 15,
    maintenanceCars: 3,
    washCars: 1,
    manager: "Lee Wei Ming",
    contact: "+60 12-567 8901",
  },
  {
    id: "4",
    name: "Pantai Cenang CP",
    address: "Jalan Pantai Cenang, Beach Front",
    totalCars: 20,
    availableCars: 9,
    maintenanceCars: 1,
    washCars: 0,
    manager: "Raj Kumar",
    contact: "+60 12-678 9012",
  },
]

export function LocationManagement() {
  const [locations, setLocations] = useState<Location[]>(mockLocations)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<string>("name")
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)

  const totalLocations = locations.length
  const totalCars = locations.reduce((sum, loc) => sum + loc.totalCars, 0)
  const carsInUse = locations.reduce(
    (sum, loc) => sum + (loc.totalCars - loc.availableCars - loc.maintenanceCars - loc.washCars),
    0,
  )
  const availableCars = locations.reduce((sum, loc) => sum + loc.availableCars, 0)

  const filteredLocations = locations
    .filter((location) => {
      const matchesSearch =
        location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.manager.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSearch
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name)
      if (sortBy === "totalCars") return b.totalCars - a.totalCars
      if (sortBy === "available") return b.availableCars - a.availableCars
      return 0
    })

  const handleViewCars = (location: Location) => {
    setSelectedLocation(location)
    setIsDetailModalOpen(true)
  }

  const handleAddLocation = (newLocation: Omit<Location, "id">) => {
    const location: Location = {
      ...newLocation,
      id: String(locations.length + 1),
    }
    setLocations([...locations, location])
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Total Locations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLocations}</div>
            <p className="text-xs text-muted-foreground">Active depots</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Total Cars</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCars}</div>
            <p className="text-xs text-muted-foreground">Across all locations</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Cars In Use</CardTitle>
            <CarFront className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{carsInUse}</div>
            <p className="text-xs text-muted-foreground">Currently rented</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Available Cars</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableCars}</div>
            <p className="text-xs text-muted-foreground">Ready for rental</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by location name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Sort by Name</SelectItem>
                <SelectItem value="totalCars">Sort by Total Cars</SelectItem>
                <SelectItem value="available">Sort by Availability</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            {/* Transfer Cars Button */}
            <Button variant="outline" onClick={() => setIsTransferModalOpen(true)} className="flex-1 sm:flex-none">
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Transfer Cars
            </Button>

            {/* Add Location Button */}
            <Button onClick={() => setIsAddModalOpen(true)} className="flex-1 sm:flex-none">
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </div>
        </div>
      </Card>

      {/* Results Count */}
      <div>
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredLocations.length}</span> of{" "}
          <span className="font-semibold text-foreground">{locations.length}</span> locations
        </p>
      </div>

      {/* Table */}
      <Card className="rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Location Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-center">Total Cars</TableHead>
                <TableHead className="text-center">Available</TableHead>
                <TableHead className="text-center">Maintenance</TableHead>
                <TableHead className="text-center">Car Wash</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLocations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    No locations found matching your search
                  </TableCell>
                </TableRow>
              ) : (
                filteredLocations.map((location) => (
                  <TableRow key={location.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-semibold">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        {location.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[250px] truncate">{location.address}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-semibold">
                        {location.totalCars}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                      >
                        {location.availableCars}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                      >
                        {location.maintenanceCars}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className="bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20"
                      >
                        {location.washCars}
                      </Badge>
                    </TableCell>
                    <TableCell>{location.manager}</TableCell>
                    <TableCell className="text-muted-foreground">{location.contact}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleViewCars(location)}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View cars</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit location</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Modals */}
      <LocationDetailModal
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        location={selectedLocation}
        allLocations={locations}
      />
      <AddLocationModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} onAddLocation={handleAddLocation} />
      <TransferCarsModal open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen} locations={locations} />
    </div>
  )
}
