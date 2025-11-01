// Script to fetch and process the fleet CSV data
const csvUrl = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Cars%2BList-XJ2T5jkXoiyJ4CvYUpfHjrFDzKtT6e.csv"

interface FleetCar {
  brand: string
  units: number
  doors: number
  engine: string
  passengers: number
  extHourLow: number
  extHourPeak: number
  fuelType: string
  image?: string
}

async function processFleetData() {
  try {
    const response = await fetch(csvUrl)
    const csvText = await response.text()

    // Parse CSV
    const lines = csvText.split("\n")
    const headers = lines[0].split(",")

    const cars: FleetCar[] = []

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue

      const values = lines[i].split(",")

      cars.push({
        brand: values[0]?.trim() || "",
        units: Number.parseInt(values[1]) || 0,
        doors: Number.parseInt(values[2]) || 0,
        engine: values[3]?.trim() || "",
        passengers: Number.parseInt(values[4]) || 0,
        extHourLow: Number.parseFloat(values[5]) || 0,
        extHourPeak: Number.parseFloat(values[6]) || 0,
        fuelType: values[7]?.trim() || "",
      })
    }

    console.log("[v0] Fleet data processed:", cars.length, "cars found")
    console.log("[v0] Sample cars:", cars.slice(0, 3))

    return cars
  } catch (error) {
    console.error("[v0] Error processing fleet data:", error)
    return []
  }
}

processFleetData()
