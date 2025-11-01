// Fleet data configuration with real car information
export interface FleetCar {
  name: string
  brand: string
  model: string
  units: number
  doors: number
  engine: string
  passengers: number
  extHourLow: number
  extHourPeak: number
  fuelType: string
  image: string
  dailyRate: number
  category: "Sedan" | "MPV" | "SUV" | "Hatchback" | "Convertible"
}

// Car image mapping
const carImageMap: Record<string, string> = {
  "TOYOTA VIOS 3G (FACELIFT)": "/toyota-vios-3g-facelift.png",
  "TOYOTA VIOS 3G": "/toyota-vios-3g.png",
  "TOYOTA AVANZA": "/toyota-avanza.png",
  "TOYOTA VELOZ": "/toyota-veloz.png",
  "TOYOTA INNOVA": "/toyota-innova.png",
  "PERODUA ALZA": "/perodua-alza.png",
  "PERODUA AXIA": "/perodua-axia.png",
  "PERODUA BEZZA": "/perodua-bezza.png",
  "SUZUKI JIMNY": "/suzuki-jimny.png",
  "MINI CONVERTIBLE SEASIDE (LIMITED EDITION)": "/classic-red-convertible.png",
}

// Helper function to determine category from car name
function getCategoryFromName(name: string): FleetCar["category"] {
  const upperName = name.toUpperCase()
  if (upperName.includes("VIOS") || upperName.includes("BEZZA")) return "Sedan"
  if (
    upperName.includes("AVANZA") ||
    upperName.includes("ALZA") ||
    upperName.includes("VELOZ") ||
    upperName.includes("INNOVA")
  )
    return "MPV"
  if (upperName.includes("JIMNY")) return "SUV"
  if (upperName.includes("AXIA")) return "Hatchback"
  if (upperName.includes("CONVERTIBLE")) return "Convertible"
  return "Sedan"
}

// Helper function to extract brand and model
function extractBrandModel(name: string): { brand: string; model: string } {
  const parts = name.split(" ")
  if (parts.length >= 2) {
    return {
      brand: parts[0],
      model: parts.slice(1).join(" "),
    }
  }
  return { brand: name, model: "" }
}

// Real fleet data based on the CSV
export const fleetCars: FleetCar[] = [
  {
    name: "MINI CONVERTIBLE SEASIDE (LIMITED EDITION)",
    brand: "MINI",
    model: "CONVERTIBLE SEASIDE",
    units: 1,
    doors: 2,
    engine: "Auto",
    passengers: 2,
    extHourLow: 50,
    extHourPeak: 50,
    fuelType: "Petrol",
    image: carImageMap["MINI CONVERTIBLE SEASIDE (LIMITED EDITION)"],
    dailyRate: 400,
    category: "Convertible",
  },
  {
    name: "TOYOTA VIOS 3G (FACELIFT)",
    brand: "TOYOTA",
    model: "VIOS 3G (FACELIFT)",
    units: 5,
    doors: 4,
    engine: "Auto",
    passengers: 5,
    extHourLow: 15,
    extHourPeak: 20,
    fuelType: "Petrol",
    image: carImageMap["TOYOTA VIOS 3G (FACELIFT)"],
    dailyRate: 150,
    category: "Sedan",
  },
  {
    name: "TOYOTA VIOS 3G",
    brand: "TOYOTA",
    model: "VIOS 3G",
    units: 3,
    doors: 4,
    engine: "Auto",
    passengers: 5,
    extHourLow: 15,
    extHourPeak: 18,
    fuelType: "Petrol",
    image: carImageMap["TOYOTA VIOS 3G"],
    dailyRate: 140,
    category: "Sedan",
  },
  {
    name: "TOYOTA AVANZA",
    brand: "TOYOTA",
    model: "AVANZA",
    units: 4,
    doors: 4,
    engine: "Auto",
    passengers: 7,
    extHourLow: 18,
    extHourPeak: 22,
    fuelType: "Petrol",
    image: carImageMap["TOYOTA AVANZA"],
    dailyRate: 180,
    category: "MPV",
  },
  {
    name: "TOYOTA VELOZ",
    brand: "TOYOTA",
    model: "VELOZ",
    units: 2,
    doors: 4,
    engine: "Auto",
    passengers: 7,
    extHourLow: 20,
    extHourPeak: 25,
    fuelType: "Petrol",
    image: carImageMap["TOYOTA VELOZ"],
    dailyRate: 200,
    category: "MPV",
  },
  {
    name: "TOYOTA INNOVA",
    brand: "TOYOTA",
    model: "INNOVA",
    units: 3,
    doors: 4,
    engine: "Auto",
    passengers: 7,
    extHourLow: 22,
    extHourPeak: 28,
    fuelType: "Diesel",
    image: carImageMap["TOYOTA INNOVA"],
    dailyRate: 220,
    category: "MPV",
  },
  {
    name: "PERODUA ALZA",
    brand: "PERODUA",
    model: "ALZA",
    units: 6,
    doors: 4,
    engine: "Auto",
    passengers: 7,
    extHourLow: 16,
    extHourPeak: 20,
    fuelType: "Petrol",
    image: carImageMap["PERODUA ALZA"],
    dailyRate: 160,
    category: "MPV",
  },
  {
    name: "PERODUA AXIA",
    brand: "PERODUA",
    model: "AXIA",
    units: 8,
    doors: 4,
    engine: "Auto",
    passengers: 5,
    extHourLow: 12,
    extHourPeak: 15,
    fuelType: "Petrol",
    image: carImageMap["PERODUA AXIA"],
    dailyRate: 120,
    category: "Hatchback",
  },
  {
    name: "PERODUA BEZZA",
    brand: "PERODUA",
    model: "BEZZA",
    units: 5,
    doors: 4,
    engine: "Auto",
    passengers: 5,
    extHourLow: 13,
    extHourPeak: 16,
    fuelType: "Petrol",
    image: carImageMap["PERODUA BEZZA"],
    dailyRate: 130,
    category: "Sedan",
  },
  {
    name: "SUZUKI JIMNY",
    brand: "SUZUKI",
    model: "JIMNY",
    units: 2,
    doors: 4,
    engine: "Auto",
    passengers: 4,
    extHourLow: 25,
    extHourPeak: 30,
    fuelType: "Petrol",
    image: carImageMap["SUZUKI JIMNY"],
    dailyRate: 250,
    category: "SUV",
  },
]

// Helper function to get available cars for booking
export function getAvailableCarsForBooking() {
  return fleetCars.map((car) => ({
    name: car.name,
    dailyRate: car.dailyRate,
    hourlyRate: car.extHourLow,
    image: car.image,
    plate: `${car.brand.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
    passengers: car.passengers,
    category: car.category,
  }))
}
