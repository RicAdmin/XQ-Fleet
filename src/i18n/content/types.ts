export type BlogTip = {
  id: string
  slug: string
  tag: string
  title: string
  excerpt: string
  img: string
}

export type Attraction = {
  n: string
  t: string
  c: string
  d: string
  airport: string
  jetty: string
  cenang: string
  kuah: string
  time: string
  mapsUrl: string
  img: string
}

export type EssentialLocation = {
  t: string
  sub: string
  meet: string
  hours: string
  tag: string
  icon: 'airport' | 'jetty' | 'info'
  phone?: string
  mapsUrl: string
}

export type FaqItem = {
  c: string
  q: string
  a: string
}

export type FaqCategory = {
  id: string
  label: string
}

export type PromoCard = {
  cls: string
  tag: string
  season: string
  title: string
  pct: number
  body: string
  image: string
}

export type CategoryCard = {
  key: string
  n: string
  title: string
  kicker: string
  body: string
  seats: string
  bags: string
  from: number
  dark: boolean
  orange: boolean
  fleetKeys: readonly ('economy' | 'mpv' | 'suv' | 'other')[]
}

export type StepItem = {
  n: string
  t: string
  d: string
}

export type WhyPerk = {
  t: string
  d: string
  stat: string
  statLabel: string
}
