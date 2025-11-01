"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRightLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

interface CarInLocation {
  id: string
  registrationNo: string
  make: string
  model: string
  status: "Available" | "Rented" | "Maintenance" | "Car Wash"
  photo: string
}

const mockCars: CarInLocation[] = [
  {
    id: "1",
    registrationNo: "ABC-1234",
    make: "Toyota",
    model: "Camry",
    status: "Available",
    photo: "/toyota-camry-sedan.png",
  },
  {
    id: "2",
    registrationNo: "XYZ-5678",
    make: "Honda",
    model: "Odyssey",
    status: "Rented",
    photo: "/honda-odyssey-mpv.jpg",
  },
  {
    id: "3",
    registrationNo: "DEF-9012",
    make: "Ford",
    model: "Explorer",
    status: "Maintenance",
    photo: "/ford-explorer-suv.jpg",
  },
  {
    id: "4",
    registrationNo: "GHI-3456",
    make: "Nissan",
    model: "Altima",
    status: "Car Wash",
    photo: "/nissan-altima-sedan.jpg",
  },
]

const statusColors = {
  Available: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  Rented: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  Maintenance: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  "Car Wash": "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20",
}

interface LocationDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  location: Location | null
  allLocations: Location[]
}

export function LocationDetailModal({ open, onOpenChange, location, allLocations }: LocationDetailModalProps) {
  const [selectedCar, setSelectedCar] = useState<string | null>(null)
  const [targetLocation, setTargetLocation] = useState<string>("")
  const { toast } = useToast()

  if (!location) return null

  const availableCars = mockCars.filter((car) => car.status === "Available")
  const rentedCars = mockCars.filter((car) => car.status === "Rented")
  const maintenanceCars = mockCars.filter((car) => car.status === "Maintenance")
  const washCars = mockCars.filter((car) => car.status === "Car Wash")

  const handleTransfer = () => {
    if (!selectedCar || !targetLocation) {
      toast({
        title: "Error",
        description: "Please select a car and target location",
        variant: "destructive",
      })
      return
    }

    const car = mockCars.find((c) => c.id === selectedCar)
    const target = allLocations.find((l) => l.id === targetLocation)

    toast({
      title: "Transfer Initiated",
      description: `${car?.make} ${car?.model} (${car?.registrationNo}) will be transferred to ${target?.name}`,
    })

    setSelectedCar(null)
    setTargetLocation("")
  }

  const CarCard = ({ car }: { car: CarInLocation }) => (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
        selectedCar === car.id
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-muted/50"
      }`}
      onClick={() => setSelectedCar(car.id)}
    >
      <img
        src={car.photo || "/placeholder.svg"}
        alt={`${car.make} ${car.model}`}
        className="w-16 h-12 object-cover rounded"
      />
      <div className="flex-1">
        <div className="font-semibold text-sm">
          {car.make} {car.model}
        </div>
        <div className="text-xs text-muted-foreground font-mono">{car.registrationNo}</div>
      </div>
      <Badge variant="outline" className={statusColors[car.status]}>
        {car.status}
      </Badge>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{location.name} - Car Details</DialogTitle>
          <p className="text-sm text-muted-foreground">{location.address}</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{location.totalCars}</div>
              <div className="text-xs text-muted-foreground">Total Cars</div>
            </div>
            <div className="bg-green-500/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">{location.availableCars}</div>
              <div className="text-xs text-muted-foreground">Available</div>
            </div>
            <div className="bg-amber-500/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{location.maintenanceCars}</div>
              <div className="text-xs text-muted-foreground">Maintenance</div>
            </div>
            <div className="bg-cyan-500/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-cyan-700 dark:text-cyan-400">{location.washCars}</div>
              <div className="text-xs text-muted-foreground">Car Wash</div>
            </div>
          </div>

          {/* Cars by Status */}
          <Tabs defaultValue="available" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="available">Available ({availableCars.length})</TabsTrigger>
              <TabsTrigger value="rented">Rented ({rentedCars.length})</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance ({maintenanceCars.length})</TabsTrigger>
              <TabsTrigger value="wash">Wash ({washCars.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="available" className="space-y-2 mt-4">
              {availableCars.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No available cars</p>
              ) : (
                availableCars.map((car) => <CarCard key={car.id} car={car} />)
              )}
            </TabsContent>

            <TabsContent value="rented" className="space-y-2 mt-4">
              {rentedCars.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No rented cars</p>
              ) : (
                rentedCars.map((car) => <CarCard key={car.id} car={car} />)
              )}
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-2 mt-4">
              {maintenanceCars.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No cars in maintenance</p>
              ) : (
                maintenanceCars.map((car) => <CarCard key={car.id} car={car} />)
              )}
            </TabsContent>

            <TabsContent value="wash" className="space-y-2 mt-4">
              {washCars.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No cars in wash</p>
              ) : (
                washCars.map((car) => <CarCard key={car.id} car={car} />)
              )}
            </TabsContent>
          </Tabs>

          {/* Transfer Section */}
          {selectedCar && (
            <div className="border-t pt-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                Transfer Selected Car
              </h3>
              <div className="flex gap-3">
                <Select value={targetLocation} onValueChange={setTargetLocation}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select target location" />
                  </SelectTrigger>
                  <SelectContent>
                    {allLocations
                      .filter((loc) => loc.id !== location.id)
                      .map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleTransfer}>Confirm Transfer</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
