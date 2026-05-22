/** Static marketing content ported from xq-car-web (Car XQ landing). */

export const HERO_BG = '/image/Rent a Car in Langkawi for Every Adventure.png'

export const FOOTER_CTA_FLEET_IMAGE = '/image/Langkawi Car Rental - Pick This Car.JPG'
export const FOOTER_CTA_SCENERY_IMAGE = '/image/Langkawi Car Rental - Pick This Car.png'

export const HOTELS = [
  'The Datai Langkawi',
  'Four Seasons Langkawi',
  'The Andaman, a Luxury Collection',
  'The Westin Langkawi Resort & Spa',
  'The Ritz-Carlton, Langkawi',
  'St Regis Langkawi',
  'Pelangi Beach Resort & Spa',
  'Berjaya Langkawi Resort',
  'Meritus Pelangi Beach Resort',
  'Tanjung Rhu Resort',
  'Bon Ton Resort',
  'Temple Tree Resort',
  'Casa Del Mar',
  'Aseania Resort',
  'Pantai Tengah Sea View Hotel',
  'Frangipani Langkawi Resort',
  'Holiday Villa Beach Resort',
  'Adya Hotel Langkawi',
  'AVANI+ Cenang Hotel',
  'Sunset Beach Resort',
  'La Pari-Pari Langkawi',
] as const

export const RENTAL_LOCATIONS = [
  {
    name: 'Pantai Cenang',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Pantai+Cenang&query_place_id=ChIJG4L3oguISzARA2GH9QhW8MM',
    mapPin: { x: 38, y: 74 },
  },
  {
    name: 'Pantai Tengah',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Pantai+Tengah&query_place_id=ChIJs-oS_tmHSzAR7jq4QsnAaZw3',
    mapPin: { x: 50, y: 80 },
  },
  {
    name: 'Kuah Town',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Kuah+Town&query_place_id=ChIJ_dVImWl_TDARotw9Phl8eZo4',
    mapPin: { x: 66, y: 64 },
  },
  {
    name: 'Pantai Kok',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Pantai+Kok&query_place_id=ChIJaTf5g_l2TDARClav_l-juEU5',
    mapPin: { x: 20, y: 46 },
  },
  {
    name: 'Tanjung Rhu',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Tanjung+Rhu&query_place_id=ChIJ24wk0n6ASzARL8_bB2636t46',
    mapPin: { x: 74, y: 20 },
  },
  {
    name: 'Datai Bay',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Datai+Bay&query_place_id=ChIJ_6S8XBlxTDARsWHSoW65WVg7',
    mapPin: { x: 16, y: 22 },
  },
  {
    name: 'Padang Matsirat',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Padang+Matsirat&query_place_id=ChIJZ4rFEC54TDARxU8NaqYscWs8',
    mapPin: { x: 30, y: 52 },
  },
  {
    name: 'Burau Bay',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Teluk+Burau&query_place_id=ChIJ-_w1gNJ3TDARmygU9stQ9xY9',
    mapPin: { x: 14, y: 58 },
  },
  {
    name: 'Telaga Harbour',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Telaga+Harbour+Marina&query_place_id=ChIJtUj7kP12TDARxr_X505F1-I',
    mapPin: { x: 18, y: 36 },
  },
  {
    name: 'Langkawi Airport',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Langkawi+International+Airport&query_place_id=ChIJYUtZgiN4TDARtnk2wHq0-eU',
    mapPin: { x: 26, y: 58 },
    meetPoint: true,
  },
  {
    name: 'Kuah Jetty',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Kuah+Jetty&query_place_id=ChIJ1cx-v4WASzARMlr2BgqXguU',
    mapPin: { x: 70, y: 70 },
    meetPoint: true,
  },
] as const

export const PICK_TIMES = [
  '07:00 AM',
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '04:30 PM',
  '05:00 PM',
  '06:00 PM',
  '07:00 PM',
  '08:00 PM',
  '09:00 PM',
  '10:00 PM',
] as const

export const BLOG_TIPS = [
  {
    id: 'ten-tips-driving-langkawi',
    slug: 'driving-langkawi-first-time',
    tag: 'Driving',
    title: '10 essential tips for driving in Langkawi',
    excerpt:
      'From left-hand-drive etiquette to navigating Pantai Cenang on a Friday evening — the basics every tourist needs.',
    img: '/image/Attractions/Sky%20bridge.png',
  },
  {
    id: 'book-rental-step-by-step',
    slug: 'book-car-rental-langkawi-online',
    tag: 'Guides',
    title: 'How to book your Car XQ rental online — step by step',
    excerpt: 'A quick visual walkthrough of every screen, so your first rental feels like your tenth.',
    img: '/image/Attractions/pantai%20cenang.png',
  },
  {
    id: 'monsoon-travel-langkawi',
    slug: 'langkawi-monsoon-season-car-rental',
    tag: 'Planning',
    title: 'Why monsoon season is the quietest time to explore',
    excerpt: 'Fewer crowds, greener hills, and off-peak rates — what to expect if you visit between May and June.',
    img: '/image/Attractions/Kilim%20Geoforest%20Park.png',
  },
] as const

export const ATTR_CATS = ['All', 'Beaches', 'Adventure', 'Nature', 'Landmarks'] as const

/** Local attraction photos in `public/image/Attractions/`. */
function attractionImage(filename: string): string {
  return `/image/Attractions/${encodeURIComponent(filename)}`
}

export const ATTRACTIONS = [
  {
    n: '01',
    t: 'Langkawi Sky Bridge',
    c: 'Adventure',
    d: 'Curved 125m suspension bridge with panoramic island and Andaman Sea views.',
    airport: '18 km',
    jetty: '31 km',
    cenang: '20 km',
    kuah: '29 km',
    time: '32 min drive',
    mapsUrl: 'https://www.google.com/maps/place/Langkawi+Sky+Bridge/@6.3860,99.6622,17z',
    img: attractionImage('Sky bridge.png'),
  },
  {
    n: '02',
    t: 'Langkawi Cable Car (SkyCab)',
    c: 'Adventure',
    d: 'Thrilling ride up to the peak of Gunung Mat Cincang.',
    airport: '18 km',
    jetty: '31 km',
    cenang: '19 km',
    kuah: '28 km',
    time: '28 min drive',
    mapsUrl: 'https://www.google.com/maps/place/Langkawi+Cable+Car/@6.3710,99.6719,17z',
    img: attractionImage('Skycab.png'),
  },
  {
    n: '03',
    t: 'Pantai Cenang',
    c: 'Beaches',
    d: 'Lively beach with white sand, water sports, and nightlife.',
    airport: '4 km',
    jetty: '22 km',
    cenang: 'Here',
    kuah: '19 km',
    time: '9 min drive',
    mapsUrl: 'https://www.google.com/maps/place/Pantai+Cenang/@6.2913,99.7289,17z',
    img: attractionImage('pantai cenang.png'),
  },
  {
    n: '04',
    t: 'Kilim Geoforest Park',
    c: 'Nature',
    d: 'UNESCO-recognized mangrove park, sea caves and diverse wildlife.',
    airport: '24 km',
    jetty: '12 km',
    cenang: '29 km',
    kuah: '11 km',
    time: '28 min drive',
    mapsUrl: 'https://www.google.com/maps/place/Kilim+Karst+Geoforest+Park/@6.4050,99.8582,17z',
    img: attractionImage('Kilim Geoforest Park.png'),
  },
  {
    n: '05',
    t: 'Tanjung Rhu Beach',
    c: 'Beaches',
    d: 'Serene beach with clear waters and a tranquil atmosphere.',
    airport: '22 km',
    jetty: '25 km',
    cenang: '26 km',
    kuah: '24 km',
    time: '31 min drive',
    mapsUrl: 'https://www.google.com/maps/place/Pantai+Tanjung+Rhu/@6.4581,99.8249,17z',
    img: attractionImage('Tanjung Rhu.png'),
  },
  {
    n: '06',
    t: 'Underwater World Langkawi',
    c: 'Landmarks',
    d: "One of Malaysia's largest aquariums.",
    airport: '5 km',
    jetty: '22 km',
    cenang: '1 km',
    kuah: '19 km',
    time: '10 min drive',
    mapsUrl: 'https://www.google.com/maps/place/Underwater+World+Langkawi/@6.2878,99.7286,17z',
    img: attractionImage('Underwater World.png'),
  },
  {
    n: '07',
    t: 'Eagle Square (Dataran Lang)',
    c: 'Landmarks',
    d: 'Iconic giant eagle sculpture overlooking the bay.',
    airport: '17 km',
    jetty: '1 km',
    cenang: '22 km',
    kuah: '4 km',
    time: '21 min drive',
    mapsUrl: 'https://www.google.com/maps/place/Eagle+Square+Langkawi/@6.3083,99.8520,17z',
    img: attractionImage('Eagle Square.png'),
  },
  {
    n: '08',
    t: 'Telaga Tujuh Waterfalls',
    c: 'Nature',
    d: 'Seven natural pools, perfect for a swim and a picnic.',
    airport: '18 km',
    jetty: '31 km',
    cenang: '20 km',
    kuah: '29 km',
    time: '28 min drive',
    mapsUrl: 'https://www.google.com/maps/place/Air+Terjun+Telaga+Tujuh/@6.3818,99.6729,17z',
    img: attractionImage('Telaga Tujuh Waterfall.png'),
  },
  {
    n: '09',
    t: 'Langkawi Wildlife Park',
    c: 'Nature',
    d: 'Interactive park with hundreds of species.',
    airport: '23 km',
    jetty: '11 km',
    cenang: '28 km',
    kuah: '10 km',
    time: '26 min drive',
    mapsUrl: 'https://www.google.com/maps/place/Langkawi+Wildlife+Park/@6.3873,99.8619,17z',
    img: attractionImage('Wildlife Park.png'),
  },
  {
    n: '10',
    t: 'Pulau Payar Marine Park',
    c: 'Beaches',
    d: 'Coral reefs and snorkeling — boat transfer from Kuah Jetty.',
    airport: 'boat',
    jetty: 'boat',
    cenang: 'boat',
    kuah: 'boat',
    time: '45 min ferry',
    mapsUrl: 'https://www.google.com/maps/place/Pulau+Payar+Marine+Park/@6.0740,100.0562,17z',
    img: attractionImage('Pulau Payar Marine Park.png'),
  },
] as const

export const ESSENTIAL_LOCATIONS = [
  {
    t: 'Langkawi Intl Airport',
    sub: 'Door 3 · LGK',
    meet: 'Outside Arrivals',
    hours: '24/7 counter',
    tag: 'Pickup',
    icon: 'airport' as const,
    mapsUrl: 'https://maps.app.goo.gl/BSUAGPQsuR5oAFkt6',
  },
  {
    t: 'Langkawi Ferry Jetty',
    sub: 'Kuah Terminal',
    meet: 'Ferry exit, taxi stand',
    hours: '06:00 – 22:00',
    tag: 'Pickup',
    icon: 'jetty' as const,
    mapsUrl: 'https://maps.app.goo.gl/FppwKtKuAusHUKJVA',
  },
  {
    t: 'Sultanah Maliha Hospital',
    sub: 'Primary hospital',
    meet: 'Jalan Kuah–Padang Matsirat',
    hours: '24/7 ER',
    tag: 'Good to know',
    icon: 'info' as const,
    phone: '+60 4 966 3333',
    mapsUrl: 'https://maps.app.goo.gl/KmbasG1kWhUhKXZ46',
  },
  {
    t: 'Langkawi Police HQ',
    sub: 'IPD Langkawi',
    meet: 'Persiaran Mutiara, Kuah',
    hours: '24/7',
    tag: 'Good to know',
    icon: 'info' as const,
    phone: '+60 4 966 6222',
    mapsUrl: 'https://maps.app.goo.gl/GdeKj3xTT7X6iES28',
  },
] as const

export const FAQS = [
  {
    c: 'Eligibility',
    q: 'What are the requirements to rent a car?',
    a: "If you're between 23 and 65 with a valid Malaysian or International Driving License and at least one year of driving experience, you're good to go.",
  },
  {
    c: 'Pickup & Extras',
    q: 'Can I drive the rental anywhere on the island?',
    a: "Yes. Our cars are perfect for exploring Langkawi from coast to coast. Driving off the island isn't allowed.",
  },
  {
    c: 'Booking & Pricing',
    q: 'How are rental rates calculated?',
    a: 'Rates are set per 24 hours, with discounts for weekly or monthly rentals. Prices vary by season and car type — feel free to ask for the latest.',
  },
  {
    c: 'Insurance & Safety',
    q: 'Is insurance included?',
    a: 'Coverage depends on the vehicle and your booking. Message us before you travel and we will confirm what applies to your rental.',
  },
  {
    c: 'Pickup & Extras',
    q: 'Can I pick up my rental car at Langkawi International Airport?',
    a: 'Yes — Langkawi airport car rental is our most popular service. We meet you at Door 3 in the Arrivals Hall of Langkawi International Airport (LGK), available 24/7. Just share your flight number when you book and we handle the rest at no extra charge.',
  },
  {
    c: 'Insurance & Safety',
    q: 'What happens if I have a breakdown?',
    a: 'Call our 24-hour line on +60 11 3521 5576 and we will guide you through the next steps.',
  },
  {
    c: 'Eligibility',
    q: 'Can I add another driver?',
    a: "Of course. Just let us know — there's a small additional driver fee, and they must meet the same age and license requirements.",
  },
  {
    c: 'Booking & Pricing',
    q: 'Can I rent for just a few hours?',
    a: "Our minimum rental is one day, but reach out if you need flexibility — we'll do our best to accommodate.",
  },
  {
    c: 'Booking & Pricing',
    q: 'How do I change or cancel my booking?',
    a: 'Contact our support team. Cancellations made more than 48 hours before pickup are free; later cancellations may have a small fee.',
  },
  {
    c: 'Pickup & Extras',
    q: 'Is Langkawi family-friendly? Do you offer child seats?',
    a: 'Very much so — and yes, we have child seats available on request for a small daily fee.',
  },
  {
    c: 'Insurance & Safety',
    q: "What if I'm running late to return the car?",
    a: "If you're more than 30 minutes late, a small late fee may apply. Just give us a heads-up and we'll work with you.",
  },
  {
    c: 'Eligibility',
    q: 'What documents do I need to bring?',
    a: "Your driver's license, passport, and a credit card for the security deposit — that's it.",
  },
  {
    c: 'Booking & Pricing',
    q: 'Can I rent a car for my whole stay?',
    a: 'Absolutely. We offer flexible weekly and monthly rates so you can explore at your own pace.',
  },
  {
    c: 'Booking & Pricing',
    q: 'What is the cheapest car rental option in Langkawi?',
    a: 'Our economy cars start from RM 70/day — the most affordable way to get around Langkawi independently. Booking early or staying 7+ nights unlocks further discounts, automatically applied at checkout.',
  },
] as const

export const FAQ_CATS = [
  { id: 'All', label: 'All questions' },
  { id: 'Booking & Pricing', label: 'Booking & pricing' },
  { id: 'Eligibility', label: 'Eligibility & drivers' },
  { id: 'Pickup & Extras', label: 'Pickup & extras' },
  { id: 'Insurance & Safety', label: 'Insurance & safety' },
] as const
