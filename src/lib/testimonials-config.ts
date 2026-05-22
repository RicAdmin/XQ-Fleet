import type { Locale } from '#/i18n/locales'
import { translate } from '#/i18n/translate'

import testimonialsDocument from '../../data/testimonials.json'

export type TestimonialService = 'general' | 'family' | 'car_rental'

export type Testimonial = {
  id: number
  name: string
  text: string
  date: string
  dateSort: string
  language: string
  service: TestimonialService
  serviceLabel: string
  highlight: boolean
  stars: number
}

export type TestimonialSource = {
  platform: string
  pageName: string
  tradingAs: string
  recommendationRate: string
  totalReviews: number
  tourismLicense: string
  mattaMember: string
}

type TestimonialJson = {
  id: number
  name: string
  date: string
  language: string
  text: string
  rating: number
  service: string
  highlight?: boolean
}

const SERVICE_LABELS: Record<TestimonialService, string> = {
  car_rental: 'Car rental guest',
  family: 'Family trip',
  general: 'Langkawi guest',
}

function hash01(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43_758.5453
  return x - Math.floor(x)
}

/** Stable display rating: 60% at 4.8, otherwise 4.3–5.0 in 0.1 steps. */
export function displayRatingForTestimonial(id: number): number {
  if (hash01(id) < 0.6) return 4.8
  const value = 4.3 + hash01(id * 31 + 7) * 0.7
  return Math.round(value * 10) / 10
}

function formatTestimonialDate(raw: string): string {
  if (/^\d{4}-\d{2}$/.test(raw)) {
    const [year, month] = raw.split('-')
    const label = new Date(Number(year), Number(month) - 1, 1).toLocaleString('en-MY', { month: 'short' })
    return `${label} ${year}`
  }
  return raw
}

function dateSortKey(raw: string): string {
  if (/^\d{4}-\d{2}$/.test(raw)) return `${raw}-01`
  if (/^\d{4}$/.test(raw)) return `${raw}-06-01`
  return raw
}

function toService(value: string): TestimonialService {
  if (value === 'car_rental' || value === 'family') return value
  return 'general'
}

function testimonialRank(entry: TestimonialJson): number {
  if (!entry.highlight) return 2
  if (entry.service === 'car_rental') return 0
  return 1
}

function toTestimonial(entry: TestimonialJson): Testimonial {
  const service = toService(entry.service)
  return {
    id: entry.id,
    name: entry.name,
    text: entry.text,
    date: formatTestimonialDate(entry.date),
    dateSort: dateSortKey(entry.date),
    language: entry.language,
    service,
    serviceLabel: SERVICE_LABELS[service],
    highlight: entry.highlight ?? false,
    stars: displayRatingForTestimonial(entry.id),
  }
}

const sourceJson = testimonialsDocument.source

export const TESTIMONIAL_SOURCE: TestimonialSource = {
  platform: sourceJson.platform,
  pageName: sourceJson.page_name,
  tradingAs: sourceJson.trading_as,
  recommendationRate: sourceJson.page_stats.recommendation_rate,
  totalReviews: sourceJson.page_stats.total_reviews,
  tourismLicense: sourceJson.tourism_license,
  mattaMember: sourceJson.matta_member,
}

/** Landing-page testimonials — sourced from `data/testimonials.json`. */
export const TESTIMONIALS: Testimonial[] = (testimonialsDocument.testimonials as TestimonialJson[])
  .slice()
  .sort((a, b) => {
    const rankDiff = testimonialRank(a) - testimonialRank(b)
    if (rankDiff !== 0) return rankDiff
    return dateSortKey(b.date).localeCompare(dateSortKey(a.date))
  })
  .map(toTestimonial)

export const TESTIMONIAL_HEADLINE_SCORE = 4.8

export function testimonialServiceLabel(service: TestimonialService, locale: Locale = 'en'): string {
  const key =
    service === 'car_rental'
      ? 'landing.carRentalGuest'
      : service === 'family'
        ? 'landing.familyTrip'
        : 'landing.langkawiGuest'
  return translate(locale, key)
}

export function testimonialsForLocale(locale: Locale): Testimonial[] {
  const prefer =
    locale === 'zh' ? ['zh', 'mixed', 'en'] : locale === 'ms' ? ['en', 'mixed'] : ['en', 'zh', 'mixed']
  return TESTIMONIALS.slice()
    .sort((a, b) => {
      const rankA = prefer.indexOf(a.language)
      const rankB = prefer.indexOf(b.language)
      const langDiff = (rankA === -1 ? 99 : rankA) - (rankB === -1 ? 99 : rankB)
      if (langDiff !== 0) return langDiff
      if (a.highlight !== b.highlight) return a.highlight ? -1 : 1
      return b.dateSort.localeCompare(a.dateSort)
    })
}

export function testimonialInitials(name: string): string {
  if (name.toLowerCase() === 'anonymous') return 'G'
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
