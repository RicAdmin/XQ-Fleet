/**
 * Seeds `cars` + `car_photos` from `data/Car.csv`.
 * Removes previous seed rows (plate_number like 'DEMO%').
 * Cover image URLs point at static files: `/image/car_model/<filename>`.
 *
 * Run: pnpm db:seed
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/node-postgres'
import { inArray, like } from 'drizzle-orm'
import pg from 'pg'

import * as schema from '../src/db/schema.ts'
import { carPhotos, cars, payments, rentals, type CarCategory } from '../src/db/schema/fleet.ts'

config({ path: ['.env.local', '.env'] })

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const csvPath = join(root, 'data', 'Car.csv')
const imageDir = join(root, 'public', 'image', 'car_model')
const PUBLIC_IMAGE_BASE = '/image/car_model'

function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      inQuotes = !inQuotes
    } else if (c === ',' && !inQuotes) {
      out.push(cur)
      cur = ''
    } else {
      cur += c
    }
  }
  out.push(cur)
  return out
}

function bodyTypeToCategory(bodyType: string): CarCategory {
  const t = bodyType.trim().toLowerCase()
  if (t === 'mpv' || t === 'van') return 'mpv'
  if (t === 'compact suv' || t === 'suv') return 'suv'
  if (t === 'convertible') return 'other'
  if (t === 'hatchback' || t === 'sedan' || t === 'kei car') return 'economy'
  return 'other'
}

function splitMakeModel(title: string): { make: string; model: string } {
  const t = title.trim()
  const i = t.indexOf(' ')
  if (i === -1) return { make: t, model: '' }
  return { make: t.slice(0, i), model: t.slice(i + 1) }
}

function rmToSen(rm: string): number {
  const n = Number.parseFloat(rm.trim())
  if (!Number.isFinite(n)) return 0
  return Math.round(n * 100)
}

function parseBool(raw: string | undefined, defaultValue = false): boolean {
  const v = (raw ?? '').trim().toLowerCase()
  if (!v) return defaultValue
  return v === 'true' || v === 'yes' || v === '1'
}

function parseIntOrNull(raw: string | undefined): number | null {
  const n = Number.parseInt((raw ?? '').trim(), 10)
  return Number.isFinite(n) ? n : null
}

function parseHighlights(raw: string | undefined): string[] | null {
  const t = (raw ?? '').trim()
  if (!t) return null
  const parts = t.split('|').map((s) => s.trim()).filter(Boolean)
  return parts.length > 0 ? parts : null
}

function parseIsoDate(raw: string | undefined): Date | null {
  const t = (raw ?? '').trim()
  if (!t) return null
  const d = new Date(t)
  return Number.isNaN(d.getTime()) ? null : d
}

function scoreImageMatch(requested: string, fileName: string): number {
  const rl = requested.toLowerCase()
  const fl = fileName.toLowerCase()
  if (fl === rl) return 1000
  if (fl.replace(/\s+/g, ' ') === rl.replace(/\s+/g, ' ')) return 900
  const stop = new Set(['for', 'the', 'and', 'langkawi', 'car', 'rental', 'png'])
  const tokens = rl
    .replace(/\.png$/i, '')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stop.has(w))
  let s = 0
  for (const tok of tokens) {
    if (fl.includes(tok)) s += 10
  }
  return s
}

function resolveImageFile(requested: string, files: string[]): string | null {
  if (!requested.trim()) return null
  const exact = files.find((f) => f === requested)
  if (exact) return exact
  const rl = requested.toLowerCase()
  const ci = files.find((f) => f.toLowerCase() === rl)
  if (ci) return ci
  let best: string | null = null
  let bestScore = 0
  for (const f of files) {
    const sc = scoreImageMatch(requested, f)
    if (sc > bestScore) {
      bestScore = sc
      best = f
    }
  }
  if (bestScore >= 30) return best
  return null
}

function publicPhotoUrl(fileName: string): string {
  const enc = fileName
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/')
  return `${PUBLIC_IMAGE_BASE}/${enc}`
}

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL is not set (.env / .env.local).')
    process.exit(1)
  }

  let imageFiles: string[] = []
  try {
    imageFiles = readdirSync(imageDir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
  } catch {
    console.warn(`No readable image directory at ${imageDir} — cars will seed without photos.`)
  }

  const raw = readFileSync(csvPath, 'utf8')
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length < 2) {
    console.error('Car.csv has no data rows.')
    process.exit(1)
  }

  const header = parseCsvLine(lines[0])
  const col = (name: string) => {
    const i = header.indexOf(name)
    if (i === -1) throw new Error(`Missing CSV column: ${name}`)
    return i
  }

  const iTitle = col('Title')
  const iSlug = col('Slug')
  const iStatus = col('Status')
  const iAvailableForBooking = col('Available_For_Booking')
  const iFeatured = col('Featured')
  const iImage = col('Image')
  const iImageAlt = col('Image_Alt_Text')
  const iMetaTitle = col('Meta_Title')
  const iMetaDesc = col('Meta_Description')
  const iShort = col('Short_Description')
  const iLong = col('Long_Description')
  const iHighlights = col('Highlights')
  const iBody = col('Body_Type')
  const iPassengers = col('Passengers')
  const iDoors = col('Doors')
  const iTransmission = col('Transmission')
  const iFuelType = col('Fuel_Type')
  const iAppleCarPlay = col('Apple_CarPlay')
  const iAndroidAuto = col('Android_Auto')
  const iBootL = col('Boot_Capacity_L')
  const iBootLabel = col('Boot_Capacity_Label')
  const iLargeBags = col('Large_Suitcases_Count')
  const iSmallBags = col('Small_Carryons_Count')
  const iCombinedL = col('Combined_Capacity_L')
  const iCombinedLabel = col('Combined_Capacity_Label')
  const iTagAdventure = col('Tag_Fun_Adventure')
  const iTagFamily = col('Tag_Family_Comfort')
  const iTagOku = col('Tag_Small_OKU')
  const iOwnership = col('Ownership')
  const iVendor = col('Vendor_Name')
  const iUnits = col('Number_Of_Units')
  const iPromoPrice = col('Promotional_Price')
  const iPrice = col('Price_Low_Season')
  const iPricePeak = col('Price_Peak_Season')
  const iPriceSuperPeak = col('Price_Super_Peak_Season')
  const iExtHourLow = col('Ext_Hour_Low')
  const iExtHourPeak = col('Ext_Hour_Peak_And_Super_Peak')
  const iLateReturn = col('Late_Return_Hourly_Fee')
  const iDeliveryAirport = col('Delivery_Fee_Airport')
  const iDeliveryHotel = col('Delivery_Fee_Hotel')
  const iFuelPolicy = col('Fuel_Policy')
  const iMinDays = col('Min_Rental_Days')
  const iMaxDays = col('Max_Rental_Days')
  const iCarLocations = col('Car_Locations')
  const iRegistration = col('Registration_Number')
  const iLastService = col('Last_Service_Date')
  const iNextServiceKm = col('Next_Service_Due_KM')
  const iNotesInternal = col('Notes_Internal')
  const iJoined = col('Joined_Date')

  const pool = new pg.Pool({ connectionString: url })
  const db = drizzle(pool, { schema })

  const demoCars = await db
    .select({ id: cars.id })
    .from(cars)
    .where(like(cars.plateNumber, 'DEMO%'))

  if (demoCars.length > 0) {
    const demoCarIds = demoCars.map((c) => c.id)

    const demoRentals = await db
      .select({ id: rentals.id })
      .from(rentals)
      .where(inArray(rentals.carId, demoCarIds))

    if (demoRentals.length > 0) {
      const demoRentalIds = demoRentals.map((r) => r.id)
      await db.delete(payments).where(inArray(payments.rentalId, demoRentalIds))
      await db.delete(rentals).where(inArray(rentals.id, demoRentalIds))
      console.log(`Removed ${demoRentals.length} DEMO rental(s) and their payments.`)
    }

    await db.delete(cars).where(inArray(cars.id, demoCarIds))
    console.log(`Removed ${demoCars.length} previous DEMO* seed car(s).`)
  }

  let inserted = 0
  for (let r = 1; r < lines.length; r++) {
    const cells = parseCsvLine(lines[r])
    const slug = cells[iSlug]?.trim()
    const title = cells[iTitle]?.trim()
    if (!slug || !title) continue

    const status = cells[iStatus]?.trim().toLowerCase()
    if (status !== 'active') {
      console.log(`Skip ${slug}: status=${cells[iStatus]}`)
      continue
    }

    const { make, model } = splitMakeModel(title)
    if (!model) {
      console.warn(`Skip ${slug}: could not split make/model from "${title}"`)
      continue
    }

    const bodyType = (cells[iBody] ?? '').trim() || null
    const category = bodyTypeToCategory(bodyType ?? 'other')
    const passengers = parseIntOrNull(cells[iPassengers]) ?? 5
    const doors = parseIntOrNull(cells[iDoors]) ?? 4
    const dailyRateSen = rmToSen(cells[iPrice] ?? '0')
    const priceLowSeasonSen = rmToSen(cells[iPrice] ?? '0')
    const pricePeakSeasonSen = rmToSen(cells[iPricePeak] ?? '0')
    const priceSuperPeakSeasonSen = rmToSen(cells[iPriceSuperPeak] ?? '0')
    const extHourLowSen = rmToSen(cells[iExtHourLow] ?? '0')
    const extHourPeakAndSuperPeakSen = rmToSen(cells[iExtHourPeak] ?? '0')
    const deliveryFeeAirportSen = rmToSen(cells[iDeliveryAirport] ?? '0')
    const deliveryFeeHotelSen = rmToSen(cells[iDeliveryHotel] ?? '0')
    const lateReturnHourlyFeeSen = rmToSen(cells[iLateReturn] ?? '0')
    const promotionalRaw = (cells[iPromoPrice] ?? '').trim()
    const promotionalPriceSen = promotionalRaw ? rmToSen(promotionalRaw) : null
    const minRentalDays = Number.parseInt(cells[iMinDays]?.trim() ?? '1', 10) || 1
    const maxRentalDays = Number.parseInt(cells[iMaxDays]?.trim() ?? '30', 10) || 30
    const numberOfUnits = parseIntOrNull(cells[iUnits]) ?? 1
    const availableForBooking = parseBool(cells[iAvailableForBooking], true)
    const notes = (cells[iShort] ?? '').trim() || null
    const requestedImage = (cells[iImage] ?? '').trim()
    const imageAlt = (cells[iImageAlt] ?? '').trim() || null
    const resolvedFile = requestedImage ? resolveImageFile(requestedImage, imageFiles) : null
    const registration = (cells[iRegistration] ?? '').trim() || null

    const plateNumber = registration || `DEMO${String(inserted + 1).padStart(3, '0')}`

    const [row] = await db
      .insert(cars)
      .values({
        plateNumber,
        make,
        model,
        year: 2024,
        color: 'silver',
        category,
        status: 'available',
        dailyRateSen,
        priceLowSeasonSen,
        pricePeakSeasonSen,
        priceSuperPeakSeasonSen,
        extHourLowSen,
        extHourPeakAndSuperPeakSen,
        deliveryFeeAirportSen,
        deliveryFeeJettySen: deliveryFeeAirportSen,
        deliveryFeeHotelSen,
        lateReturnHourlyFeeSen,
        promotionalPriceSen,
        minRentalDays,
        maxRentalDays,
        availableForBooking,
        notes,
        currentMileage: null,
        slug,
        featured: parseBool(cells[iFeatured]),
        metaTitle: (cells[iMetaTitle] ?? '').trim() || null,
        metaDescription: (cells[iMetaDesc] ?? '').trim() || null,
        longDescription: (cells[iLong] ?? '').trim() || null,
        highlights: parseHighlights(cells[iHighlights]),
        bodyType,
        passengers,
        doors,
        transmission: (cells[iTransmission] ?? '').trim() || null,
        fuelType: (cells[iFuelType] ?? '').trim() || null,
        appleCarPlay: parseBool(cells[iAppleCarPlay]),
        androidAuto: parseBool(cells[iAndroidAuto]),
        bootCapacityL: parseIntOrNull(cells[iBootL]),
        bootCapacityLabel: (cells[iBootLabel] ?? '').trim() || null,
        largeSuitcasesCount: parseIntOrNull(cells[iLargeBags]),
        smallCarryonsCount: parseIntOrNull(cells[iSmallBags]),
        combinedCapacityL: parseIntOrNull(cells[iCombinedL]),
        combinedCapacityLabel: (cells[iCombinedLabel] ?? '').trim() || null,
        tagFunAdventure: parseBool(cells[iTagAdventure]),
        tagFamilyComfort: parseBool(cells[iTagFamily]),
        tagSmallOku: parseBool(cells[iTagOku]),
        ownedByFleet: parseBool(cells[iOwnership], true),
        vendorName: (cells[iVendor] ?? '').trim() || null,
        numberOfUnits,
        fuelPolicy: (cells[iFuelPolicy] ?? '').trim() || null,
        carLocations: (cells[iCarLocations] ?? '').trim() || null,
        registrationNumber: registration,
        lastServiceDate: parseIsoDate(cells[iLastService]),
        nextServiceDueKm: parseIntOrNull(cells[iNextServiceKm]),
        notesInternal: (cells[iNotesInternal] ?? '').trim() || null,
        joinedDate: parseIsoDate(cells[iJoined]),
      })
      .returning({ id: cars.id })

    if (!row) continue

    if (resolvedFile) {
      await db.insert(carPhotos).values({
        carId: row.id,
        url: publicPhotoUrl(resolvedFile),
        altText: imageAlt,
        sortOrder: 0,
        isCover: true,
      })
      console.log(`+ ${plateNumber} ${make} ${model} (${passengers} pax) → ${publicPhotoUrl(resolvedFile)}`)
    } else {
      console.warn(
        `+ ${plateNumber} ${make} ${model} — no image match for "${requestedImage}" (add file under public/image/car_model/)`,
      )
    }

    inserted++
  }

  await pool.end()
  console.log(`Done. Inserted ${inserted} car(s).`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
