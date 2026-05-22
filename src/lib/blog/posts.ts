import type { BlogPost, BlogSection } from '#/lib/blog/types'
import {
  DEFAULT_AUTHOR,
  blogImage,
  estimateReadTime,
} from '#/lib/blog/utils'

const HERO =
  'https://images.unsplash.com/photo-1493238792000-8113da705763?w=1800&q=85'

function post(
  base: Omit<BlogPost, 'readTimeMin' | 'author'> & { sections: BlogSection[] },
): BlogPost {
  return {
    ...base,
    author: DEFAULT_AUTHOR,
    readTimeMin: estimateReadTime(base.sections, base.lead),
  }
}

export const BLOG_POSTS: BlogPost[] = [
  post({
    slug: 'car-rental-langkawi-complete-guide',
    title: 'Complete Guide to Car Rental in Langkawi (2026)',
    metaTitle: 'Car Rental Langkawi Guide 2026 | Prices, Pickup & Tips · Car XQ',
    metaDescription:
      'Everything you need to know about car rental in Langkawi — airport pickup, daily rates from RM 70, documents, insurance, and local driving tips from a family-run fleet since 2015.',
    category: 'Guides',
    tag: 'Pillar guide',
    publishedAt: '2026-01-08',
    updatedAt: '2026-05-15',
    featured: true,
    heroImage: HERO,
    keywords: ['car rental langkawi', 'langkawi car rental', 'rent a car langkawi'],
    excerpt:
      'Airport delivery, fair daily rates, and the documents you actually need — a local operator’s guide to renting on the island.',
    lead:
      'Car rental in Langkawi is the most flexible way to explore 478 km² of beaches, viewpoints, and mangrove parks at your own pace. Most visitors pick up at Langkawi International Airport (LGK) or Kuah Ferry Jetty; rates start around RM 70/day for economy cars when booked direct with a local fleet like Car XQ.',
    sections: [
      {
        type: 'h2',
        text: 'Why rent a car in Langkawi instead of taxis?',
      },
      {
        type: 'p',
        text:
          'Langkawi has no rail and limited bus coverage outside Pantai Cenang and Kuah. Taxis and e-hailing work for single trips but add up quickly for multi-stop days — Sky Bridge, Kilim Geoforest, Tanjung Rhu, and a sunset dinner can mean four separate fares. A rental car pays for itself after two full days of sightseeing for most couples and families.',
      },
      {
        type: 'h2',
        text: 'What does Langkawi car rental cost in 2026?',
      },
      {
        type: 'p',
        text:
          'Economy sedans and hatchbacks typically run RM 70–120/day. MPVs for families (Perodua Alza, Toyota Innova) sit around RM 120–180/day. Weekly and monthly discounts apply when you book 7+ nights. Car XQ includes free delivery to LGK Door 3, the ferry jetty, or your hotel — no separate transfer fee.',
      },
      {
        type: 'ul',
        items: [
          'Economy: RM 70+/day — couples, light luggage, Cenang base',
          'MPV: RM 120+/day — families, airport runs, north-island trips',
          'SUV / 4×4: RM 150+/day — Telaga Tujuh, rough parking, adventure feel',
        ],
      },
      {
        type: 'h2',
        text: 'Documents and age requirements',
      },
      {
        type: 'p',
        text:
          'You need a valid driving licence (Malaysian or International Driving Permit), passport or IC, and a credit card for the security deposit. Minimum age is 23 with at least one year of driving experience. We verify documents at pickup — having PDFs ready in email speeds up handover at the airport counter.',
      },
      {
        type: 'h2',
        text: 'Book direct for the best Langkawi car rental experience',
      },
      {
        type: 'p',
        text:
          'Booking on carxq.com takes about 90 seconds: choose dates, select a car, add pickup location (airport, jetty, or hotel), and pay online or at pickup. You deal with the same team that meets you at Door 3 — not a mainland broker who never sees the island.',
      },
    ],
  }),

  post({
    slug: 'langkawi-airport-car-rental-pickup',
    title: 'Langkawi Airport Car Rental: Door 3 Pickup Guide',
    metaTitle: 'Langkawi Airport Car Rental (LGK) · Door 3 Pickup · Car XQ',
    metaDescription:
      'Langkawi airport car rental with free Door 3 Arrivals pickup at LGK. Share your flight number, meet in 5 minutes, no extra airport surcharge. 24/7 counter.',
    category: 'Airport & Pickup',
    tag: 'Airport',
    publishedAt: '2026-01-15',
    updatedAt: '2026-04-20',
    heroImage: blogImage('Sky bridge.png'),
    keywords: ['langkawi airport car rental', 'lgk car rental', 'langkawi international airport car hire'],
    excerpt: 'Step-by-step: from baggage claim to driving off in under 15 minutes at LGK Door 3.',
    lead:
      'Langkawi airport car rental is simplest when your supplier meets you inside Arrivals. Car XQ operates a 24/7 counter at Door 3 of Langkawi International Airport (LGK) — share your flight number when booking and we track delays at no extra charge.',
    sections: [
      { type: 'h2', text: 'Where to meet at LGK' },
      {
        type: 'p',
        text:
          'After immigration and baggage claim, exit into the Arrivals hall and look for Door 3 on your left. Our team holds a Car XQ sign with your name. The walk from the domestic belt to Door 3 is under three minutes; international arrivals add five to ten minutes depending on queue.',
      },
      { type: 'h2', text: 'What to have ready at airport pickup' },
      {
        type: 'ul',
        items: [
          'Booking confirmation (email or app)',
          'Passport and driving licence (physical cards)',
          'Credit card for deposit',
          'Flight number — already on your booking if you entered it online',
        ],
      },
      { type: 'h2', text: 'Airport parking and driving out' },
      {
        type: 'p',
        text:
          'We walk you to the rental car in the short-term parking lane adjacent to the terminal. First-time visitors: exit the airport roundabout and follow signs to Pantai Cenang (west) or Kuah (east). GPS works well; download offline maps if your data starts at the airport Wi‑Fi only.',
      },
      { type: 'h2', text: 'Returning your car to LGK' },
      {
        type: 'p',
        text:
          'Return is the same Door 3 meeting point unless you arranged hotel drop-off. Allow 30 minutes before check-in for inspection and deposit release. Early-morning flights: we open 24/7 — no after-hours penalty.',
      },
    ],
  }),

  post({
    slug: 'cheap-car-rental-langkawi-tips',
    title: 'Cheap Car Rental in Langkawi: 7 Ways to Save',
    metaTitle: 'Cheap Car Rental Langkawi · 7 Money-Saving Tips · Car XQ',
    metaDescription:
      'Cheap car rental Langkawi from RM 70/day. Book early, stay 7+ nights, choose economy, and avoid broker markups — seven practical ways to pay less.',
    category: 'Pricing',
    tag: 'Save money',
    publishedAt: '2026-01-22',
    updatedAt: '2026-03-10',
    heroImage: blogImage('pantai cenang.png'),
    keywords: ['cheap car rental langkawi', 'affordable car hire langkawi', 'budget car rental langkawi'],
    excerpt: 'Seven practical ways to lower your daily rate without sacrificing safety or support.',
    lead:
      'Cheap car rental in Langkawi does not mean old cars or hidden fees. The lowest legitimate rates — from RM 70/day — come from booking direct with a local fleet, choosing economy class, and aligning your rental length with weekly discounts.',
    sections: [
      { type: 'h2', text: '1. Book direct, not through aggregators' },
      {
        type: 'p',
        text:
          'Comparison sites add broker margin and push insurance upsells you may not need. Car XQ prices on this site are the same rates our counter staff quote — no middleman.',
      },
      { type: 'h2', text: '2. Rent 7+ nights for automatic discounts' },
      {
        type: 'p',
        text:
          'Weekly rates drop the effective daily cost by 10–20%. If you are staying five nights, consider extending two days for beach hops — the math often favours a week block.',
      },
      { type: 'h2', text: '3. Pick economy unless you need space' },
      {
        type: 'p',
        text:
          'A Perodua Bezza or similar handles Cenang, Kuah, and Sky Bridge comfortably for two adults. Upgrade to MPV only when luggage or child seats demand it.',
      },
      { type: 'h2', text: '4. Avoid peak-hour add-ons' },
      {
        type: 'ul',
        items: [
          'School holidays and December — book 2–3 weeks ahead',
          'Monsoon shoulder (May–June) — quieter roads and softer demand',
          'Mid-week pickup vs Friday evening ferry arrivals',
        ],
      },
      { type: 'h2', text: '5. Use promo codes at checkout' },
      {
        type: 'p',
        text:
          'Check our homepage banner and newsletter for seasonal codes. Applying a valid promo at booking beats negotiating at the counter.',
      },
    ],
  }),

  post({
    slug: 'rent-a-car-langkawi-requirements',
    title: 'How to Rent a Car in Langkawi: Requirements & Documents',
    metaTitle: 'Rent a Car Langkawi · Documents & Requirements · Car XQ',
    metaDescription:
      'Rent a car in Langkawi with a valid licence, ID, and credit card. Age 23+, 1 year experience. Malaysian or IDP accepted. Step-by-step for tourists.',
    category: 'Guides',
    tag: 'Requirements',
    publishedAt: '2026-02-01',
    updatedAt: '2026-04-01',
    heroImage: HERO,
    keywords: ['rent a car langkawi', 'langkawi car rental requirements', 'langkawi rental documents'],
    excerpt: 'Licence rules, deposits, and what tourists from Singapore, UK, and Australia need.',
    lead:
      'To rent a car in Langkawi you must be 23 or older, hold a valid driving licence for at least one year, and present ID plus a credit card for the refundable deposit. Tourists use an International Driving Permit (IDP) alongside their home licence unless their licence is already in English and accepted under JPJ guidelines.',
    sections: [
      { type: 'h2', text: 'Licence rules for foreign visitors' },
      {
        type: 'p',
        text:
          'Malaysia recognises IDPs issued under the 1949 Geneva Convention. Carry both IDP and original licence. Singapore and Brunei licences are commonly accepted for short stays; when in doubt, obtain an IDP before travel — it costs little and removes debate at pickup.',
      },
      { type: 'h2', text: 'Deposit and payment' },
      {
        type: 'p',
        text:
          'A pre-authorisation on credit card covers minor damage or fuel differences. Debit cards are not accepted for deposit. Full rental can be paid online via FPX, card, or at pickup in approved cases.',
      },
      { type: 'h2', text: 'Additional drivers' },
      {
        type: 'p',
        text:
          'Add a second driver at booking for a small daily fee. They must meet the same age and licence rules and present documents at pickup.',
      },
    ],
  }),

  post({
    slug: 'langkawi-ferry-jetty-car-rental',
    title: 'Kuah Ferry Jetty Car Rental & Pickup Guide',
    metaTitle: 'Langkawi Ferry Jetty Car Rental · Kuah Pickup · Car XQ',
    metaDescription:
      'Rent a car at Langkawi Ferry Jetty (Kuah). Meet at the taxi stand exit, 06:00–22:00 daily. Ideal for Penang–Langkawi ferry arrivals.',
    category: 'Airport & Pickup',
    tag: 'Ferry',
    publishedAt: '2026-02-08',
    updatedAt: '2026-04-12',
    heroImage: blogImage('Eagle Square.png'),
    keywords: ['langkawi ferry car rental', 'kuah jetty car rental', 'langkawi ferry jetty rent car'],
    excerpt: 'Arriving by ferry from Penang or Kuala Kedah? Pick up your car steps from the terminal.',
    lead:
      'Langkawi ferry jetty car rental suits travellers who arrive by boat at Kuah Terminal. Car XQ meets you at the ferry exit near the taxi stand — no need to cross town to an office. Counter hours follow ferry peaks: roughly 06:00–22:00 daily.',
    sections: [
      { type: 'h2', text: 'Penang and mainland ferry arrivals' },
      {
        type: 'p',
        text:
          'Disembark, clear the terminal, and look for Car XQ signage at the main exit. WhatsApp us when you see land — we pull the car to the forecourt. Typical wait under ten minutes during scheduled arrivals.',
      },
      { type: 'h2', text: 'Combine jetty pickup with Kuah errands' },
      {
        type: 'p',
        text:
          'Kuah is ideal for stocking up: duty-free chocolate, Eagle Square photos, and lunch before driving west to Cenang or north to Tanjung Rhu. Your car saves repeated taxi quotes for each stop.',
      },
    ],
  }),

  post({
    slug: 'best-car-langkawi-family-trip',
    title: 'Best Cars for a Langkawi Family Trip',
    metaTitle: 'Best Family Car Rental Langkawi · MPV Guide · Car XQ',
    metaDescription:
      'Best car for Langkawi family trip: MPV vs sedan, luggage space, child seats, and AC comfort for island drives. Perodua Alza, Innova & more.',
    category: 'Planning',
    tag: 'Family',
    publishedAt: '2026-02-15',
    updatedAt: '2026-05-01',
    heroImage: blogImage('Underwater World.png'),
    keywords: ['best car langkawi family', 'mpv rental langkawi', 'family car rental langkawi'],
    excerpt: 'MPV vs sedan — how to choose for kids, luggage, and long island days.',
    lead:
      'The best car for a Langkawi family trip is usually an MPV: three-row seating or flexible boot space for strollers, beach gear, and airport luggage. Sedans work for families of three with light bags; groups of four or more should book an Alza-class MPV or larger Innova.',
    sections: [
      { type: 'h2', text: 'Sedan vs MPV for Langkawi roads' },
      {
        type: 'p',
        text:
          'Roads are paved and generally well-maintained; you do not need an SUV for standard tourism. MPVs offer higher seating — easier for child seats and sightseeing — and better AC cooling when fully loaded.',
      },
      { type: 'h2', text: 'Child seats and extras' },
      {
        type: 'p',
        text:
          'Request child seats at booking (small daily fee). We install before pickup. Bring sun shades for rear windows on west-coast afternoon drives.',
      },
      { type: 'h2', text: 'Sample fleet picks' },
      {
        type: 'ul',
        items: [
          'Couple + infant: economy sedan + rear-facing seat',
          'Two kids + bags: Perodua Alza or equivalent',
          'Extended family (6+): Toyota Innova or Staria class',
        ],
      },
    ],
  }),

  post({
    slug: 'driving-langkawi-first-time',
    title: 'Driving in Langkawi for the First Time: 10 Tips',
    metaTitle: 'Driving in Langkawi · 10 Tips for Tourists · Car XQ',
    metaDescription:
      'First time driving in Langkawi? Left-hand traffic, roundabouts, fuel, parking, and speed limits — ten practical tips from local renters since 2015.',
    category: 'Driving',
    tag: 'Driving tips',
    publishedAt: '2026-02-22',
    updatedAt: '2026-03-28',
    heroImage: blogImage('Skycab.png'),
    keywords: ['driving in langkawi', 'langkawi driving tips', 'drive langkawi tourist'],
    excerpt: 'Left-hand drive, monkeys on the road, and where to refuel — ten local tips.',
    lead:
      'Driving in Langkawi is manageable for first-time visitors: traffic is lighter than Kuala Lumpur, speed limits are modest, and signage is bilingual. You drive on the left, yield at roundabouts to traffic already circling, and watch for motorcycles filtering between lanes.',
    sections: [
      { type: 'h2', text: 'Speed and enforcement' },
      {
        type: 'p',
        text:
          'Main roads: 60–80 km/h. Residential and beach strips: 40–50 km/h. Fixed cameras exist near Kuah and on approaches to Cenang — fines reach you by mail if you ignore them.',
      },
      { type: 'h2', text: 'Fuel and refuel strategy' },
      {
        type: 'p',
        text:
          'Petrol stations cluster in Kuah, Cenang, and Padang Matsirat. Fill before north-island day trips — options thin past Tanjung Rhu. Return policy is same-to-same: refill near your return point.',
      },
      { type: 'h2', text: 'Wildlife and weather' },
      {
        type: 'ul',
        items: [
          'Monkeys near Telaga Tujuh — do not feed; secure food in the car',
          'Sudden tropical showers — reduce speed; wipers on early',
          'Night driving: dimly lit stretches north of Datai — take it slow',
        ],
      },
    ],
  }),

  post({
    slug: 'langkawi-3-day-itinerary-by-car',
    title: 'Langkawi 3-Day Itinerary by Car',
    metaTitle: 'Langkawi 3-Day Itinerary by Car · Beach & Sky Bridge · Car XQ',
    metaDescription:
      'Langkawi 3-day driving itinerary: Pantai Cenang, Sky Bridge, Kilim Geoforest, Tanjung Rhu, and Kuah — distances and timing from a local fleet.',
    category: 'Planning',
    tag: 'Itinerary',
    publishedAt: '2026-03-01',
    updatedAt: '2026-05-10',
    heroImage: blogImage('Kilim Geoforest Park.png'),
    keywords: ['langkawi itinerary by car', 'langkawi 3 day itinerary', 'langkawi road trip'],
    excerpt: 'Three days, four zones — a driveable loop that avoids backtracking.',
    lead:
      'A Langkawi 3-day itinerary by car covers west beaches, east mangroves, and north viewpoints without rushing. Base in Pantai Cenang or Kuah; expect 40–90 minutes driving per day plus stops.',
    sections: [
      { type: 'h2', text: 'Day 1 — West coast & Cenang' },
      {
        type: 'p',
        text:
          'Morning: Underwater World or beach time. Afternoon: Cenang to Pantai Tengah for sunset. Evening: duty-free dinner in Cenang. Driving: under 20 km total.',
      },
      { type: 'h2', text: 'Day 2 — Sky Bridge & Telaga Tujuh' },
      {
        type: 'p',
        text:
          'Drive to Oriental Village, SkyCab and Sky Bridge (book morning slots). Continue to Telaga Tujuh waterfalls. Allow full day; parking at both sites.',
      },
      { type: 'h2', text: 'Day 3 — Kilim or Tanjung Rhu' },
      {
        type: 'p',
        text:
          'Choose Kilim Geoforest boat tour (park at Kilim jetty) or Tanjung Rhu beach and black-sand picnic. Return via Kuah for Eagle Square if flying out next day.',
      },
    ],
  }),

  post({
    slug: 'langkawi-monsoon-season-car-rental',
    title: 'Renting a Car in Langkawi During Monsoon Season',
    metaTitle: 'Langkawi Monsoon Car Rental · May–June Guide · Car XQ',
    metaDescription:
      'Langkawi monsoon season car rental: quieter roads, lower rates, rain driving tips, and what to expect May–June and September–October.',
    category: 'Planning',
    tag: 'Seasonal',
    publishedAt: '2026-03-08',
    updatedAt: '2026-04-18',
    heroImage: blogImage('Tanjung Rhu.png'),
    keywords: ['langkawi monsoon car rental', 'langkawi rainy season drive', 'off peak langkawi rental'],
    excerpt: 'Fewer crowds, greener hills, and softer prices — how to drive safely in wet season.',
    lead:
      'Langkawi monsoon season (typically May–June and heavier rains September–October) brings afternoon showers, not all-day storms. Car rental remains the best way to move between brief rain windows — and off-peak rates can be 15–25% below peak holiday pricing.',
    sections: [
      { type: 'h2', text: 'What to expect on the road' },
      {
        type: 'p',
        text:
          'Morning drives are often dry; plan Sky Bridge and outdoor viewpoints before lunch. Keep a light jacket in the car; AC dries cabin fast after a downpour.',
      },
      { type: 'h2', text: 'Insurance and visibility' },
      {
        type: 'p',
        text:
          'Standard fleet insurance covers weather-related incidents per your agreement. Use headlights in heavy rain (law requires when wipers are on). Avoid flooded dips — turn around if water crosses the centre line.',
      },
    ],
  }),

  post({
    slug: 'langkawi-car-rental-vs-taxi-grab',
    title: 'Car Rental vs Taxi vs Grab in Langkawi',
    metaTitle: 'Car Rental vs Grab Langkawi · Cost Comparison · Car XQ',
    metaDescription:
      'Car rental vs taxi vs Grab in Langkawi: break-even analysis for 2–7 day trips, airport transfers, and multi-stop sightseeing.',
    category: 'Pricing',
    tag: 'Compare',
    publishedAt: '2026-03-15',
    updatedAt: '2026-04-25',
    heroImage: HERO,
    keywords: ['langkawi car rental vs grab', 'langkawi taxi vs rent car', 'langkawi transport comparison'],
    excerpt: 'When Grab wins — and when a rental pays for itself by day two.',
    lead:
      'Car rental vs Grab in Langkawi breaks even around two full sightseeing days for a couple. Single airport transfer + one beach day favours e-hailing; three or more days of scattered attractions favour a rental from RM 70/day.',
    sections: [
      { type: 'h2', text: 'Cost snapshot (indicative)' },
      {
        type: 'ul',
        items: [
          'Airport → Cenang Grab: RM 35–55 one way',
          'Cenang → Sky Bridge return Grab: RM 80–120',
          'Economy rental: RM 70/day + fuel ~RM 20/day',
        ],
      },
      { type: 'h2', text: 'When rental wins' },
      {
        type: 'p',
        text:
          'Multiple daily stops, child seats, early starts before Grab supply peaks, and north-island routes with weak e-hail coverage.',
      },
      { type: 'h2', text: 'When Grab wins' },
      {
        type: 'p',
        text:
          'One-night layover, heavy evening drinking, or Cenang-only plans with no north-island ambition.',
      },
    ],
  }),

  post({
    slug: 'langkawi-car-rental-insurance',
    title: 'Car Rental Insurance in Langkawi Explained',
    metaTitle: 'Langkawi Car Rental Insurance · What\'s Covered · Car XQ',
    metaDescription:
      'Langkawi car rental insurance: collision damage, third party, excess, and what to ask before you sign. Plain-language guide for tourists.',
    category: 'Guides',
    tag: 'Insurance',
    publishedAt: '2026-03-22',
    updatedAt: '2026-05-05',
    heroImage: HERO,
    keywords: ['langkawi car rental insurance', 'car hire insurance malaysia langkawi'],
    excerpt: 'CDW, excess, and what your travel card might already cover.',
    lead:
      'Car rental insurance in Langkawi typically includes basic third-party liability as required by Malaysian law. Collision damage waiver (CDW) reduces your financial exposure if the vehicle is damaged — terms vary by car class and booking channel. Always read the excess amount before pickup.',
    sections: [
      { type: 'h2', text: 'What is usually included' },
      {
        type: 'ul',
        items: [
          'Third-party bodily injury and property (statutory minimum)',
          'Basic collision coverage per fleet policy',
          '24/7 roadside assistance for breakdowns',
        ],
      },
      { type: 'h2', text: 'Travel credit card coverage' },
      {
        type: 'p',
        text:
          'Some premium cards include rental car excess insurance if you pay the full rental with that card. Bring proof and policy wording — local counters cannot guess your bank’s rules.',
      },
    ],
  }),

  post({
    slug: 'pantai-cenang-car-rental-guide',
    title: 'Pantai Cenang Car Rental & Parking Guide',
    metaTitle: 'Pantai Cenang Car Rental · Parking & Hotels · Car XQ',
    metaDescription:
      'Rent a car in Pantai Cenang with hotel delivery. Parking tips, one-way streets, and best pickup points along the main beach strip.',
    category: 'Planning',
    tag: 'Cenang',
    publishedAt: '2026-03-29',
    updatedAt: '2026-04-30',
    heroImage: blogImage('pantai cenang.png'),
    keywords: ['pantai cenang car rental', 'cenang beach car hire', 'langkawi cenang parking'],
    excerpt: 'Hotel delivery, beach parking, and avoiding Cenang’s evening traffic pinch points.',
    lead:
      'Pantai Cenang car rental is popular because the strip is the island’s tourist hub — but parking fills after 17:00. Car XQ delivers free to Cenang hotels and homestays; specify your property name and we meet at the lobby or main road access.',
    sections: [
      { type: 'h2', text: 'Parking along the strip' },
      {
        type: 'p',
        text:
          'Use marked hotel bays or commercial lots behind the main road. Avoid blocking shop shutters — enforcement tow during peak season. Moto parking is separate; keep car keys secure at beach walks.',
      },
      { type: 'h2', text: 'Driving Cenang to Sky Bridge' },
      {
        type: 'p',
        text:
          'Allow 40 minutes off-peak, 55 in evening traffic. Leave before 09:00 for SkyCab slots; return before sunset if you dislike narrow hill roads in the dark.',
      },
    ],
  }),

  post({
    slug: 'kuah-town-langkawi-car-rental',
    title: 'Kuah Town Car Rental: Jetty, Shopping & Day Trips',
    metaTitle: 'Kuah Langkawi Car Rental · Town & Jetty Guide · Car XQ',
    metaDescription:
      'Kuah town car rental for ferry arrivals, Eagle Square, duty-free shopping, and east-coast day trips. Free jetty and hotel pickup.',
    category: 'Planning',
    tag: 'Kuah',
    publishedAt: '2026-04-05',
    updatedAt: '2026-05-08',
    heroImage: blogImage('Eagle Square.png'),
    keywords: ['kuah langkawi car rental', 'kuah town rent car', 'langkawi kuah car hire'],
    excerpt: 'Base in Kuah for ferry access, shopping, and east-coast mangrove runs.',
    lead:
      'Kuah town car rental suits ferry arrivals and travellers who prefer duty-free shopping and calmer evenings over beach nightlife. Pick up at the jetty or any Kuah hotel — Eagle Square and the main mall strips are minutes away by car.',
    sections: [
      { type: 'h2', text: 'Kuah as a base' },
      {
        type: 'p',
        text:
          'Central for Kilim Geoforest (15 min), ferry departures, and hospital access. Cenang is 25–35 min west — fine as a day trip when you have a car.',
      },
      { type: 'h2', text: 'Shopping and load limits' },
      {
        type: 'p',
        text:
          'Duty-free alcohol and chocolate runs fill boots quickly — book an MPV if you shop heavy before driving to your resort.',
      },
    ],
  }),

  post({
    slug: 'langkawi-sky-bridge-by-car',
    title: 'How to Drive to Langkawi Sky Bridge & SkyCab',
    metaTitle: 'Drive to Langkawi Sky Bridge · Parking & Tips · Car XQ',
    metaDescription:
      'Driving to Langkawi Sky Bridge and SkyCab: parking at Oriental Village, timing, tickets, and road conditions from Cenang and Kuah.',
    category: 'Driving',
    tag: 'Attractions',
    publishedAt: '2026-04-12',
    updatedAt: '2026-05-12',
    heroImage: blogImage('Sky bridge.png'),
    keywords: ['langkawi sky bridge by car', 'drive to sky bridge langkawi', 'oriental village parking'],
    excerpt: 'Oriental Village parking, ticket timing, and the hill road from any base.',
    lead:
      'Driving to Langkawi Sky Bridge means parking at Oriental Village at the foot of Gunung Mat Cincang, then riding the SkyCab to the bridge. The access road is paved but winding — allow 40 minutes from Pantai Cenang, 35 from Kuah, 25 from the airport.',
    sections: [
      { type: 'h2', text: 'Parking and tickets' },
      {
        type: 'p',
        text:
          'Large car park at Oriental Village; arrive before 10:00 on weekends. SkyCab + bridge tickets sell out on public holidays — buy online when possible.',
      },
      { type: 'h2', text: 'Combine with Telaga Tujuh' },
      {
        type: 'p',
        text:
          'Waterfalls are 10 minutes further north — one full day for both. Wear closed shoes; bridge closes in lightning.',
      },
    ],
  }),

  post({
    slug: 'kilim-geoforest-park-road-trip',
    title: 'Kilim Geoforest Park by Car: Mangrove Road Trip',
    metaTitle: 'Kilim Geoforest Park by Car · Driving Guide · Car XQ',
    metaDescription:
      'Drive to Kilim Karst Geoforest Park from Kuah or Cenang. Parking, boat tours, eagles, and mangrove timing tips.',
    category: 'Driving',
    tag: 'Attractions',
    publishedAt: '2026-04-18',
    updatedAt: '2026-05-14',
    heroImage: blogImage('Kilim Geoforest Park.png'),
    keywords: ['kilim geoforest park by car', 'kilim langkawi drive', 'mangrove tour langkawi car'],
    excerpt: 'Park at Kilim jetty, book a boat tour, and combine with Tanjung Rhu lunch.',
    lead:
      'Kilim Geoforest Park by car is easiest from Kuah (20 min) or Pantai Cenang (50 min). Drive to Kilim Jetty, park in the designated lot, and join a shared or private mangrove boat tour — cars do not enter the geoforest itself.',
    sections: [
      { type: 'h2', text: 'Best time for wildlife' },
      {
        type: 'p',
        text:
          'Morning tours see more eagle feeding activity and calmer water. High tide improves access to some caves — check tide tables when booking.',
      },
      { type: 'h2', text: 'North-coast extension' },
      {
        type: 'p',
        text:
          'After Kilim, drive to Tanjung Rhu for lunch (15 min). Full north loop returns via Datai — scenic but hilly; fuel up in Kuah first.',
      },
    ],
  }),

  post({
    slug: 'tanjung-rhu-beach-drive-langkawi',
    title: 'Tanjung Rhu Beach Drive: North Langkawi Escape',
    metaTitle: 'Tanjung Rhu Drive · North Langkawi Beach · Car XQ',
    metaDescription:
      'Scenic drive to Tanjung Rhu Beach Langkawi. Route from Kuah, parking, resorts, and combining with Kilim Geoforest.',
    category: 'Driving',
    tag: 'Beaches',
    publishedAt: '2026-04-22',
    updatedAt: '2026-05-16',
    heroImage: blogImage('Tanjung Rhu.png'),
    keywords: ['tanjung rhu langkawi drive', 'north langkawi beach car', 'tanjung rhu parking'],
    excerpt: 'Quiet sand, clear water, and one of the island’s best scenic drives.',
    lead:
      'The Tanjung Rhu beach drive rewards renters with Langkawi’s quietest main beach — white sand, shallow water, and fewer touts than Cenang. Route from Kuah via Kilim (45 min) or from Cenang via the north coast (55 min).',
    sections: [
      { type: 'h2', text: 'Public beach access' },
      {
        type: 'p',
        text:
          'Public section beside resort entrances; park in signed areas. Respect resort driveways — guards redirect day visitors politely.',
      },
      { type: 'h2', text: 'Sunset return drive' },
      {
        type: 'p',
        text:
          'Sunset is spectacular but leave before full dark if you are unfamiliar with north roads — no street lighting on some stretches.',
      },
    ],
  }),

  post({
    slug: 'langkawi-hotel-car-delivery',
    title: 'Free Hotel Car Delivery in Langkawi',
    metaTitle: 'Free Hotel Car Delivery Langkawi · How It Works · Car XQ',
    metaDescription:
      'Free car delivery to Langkawi hotels, resorts, and homestays. Pantai Cenang, Kuah, Datai, and The Andaman — no extra fee at Car XQ.',
    category: 'Airport & Pickup',
    tag: 'Delivery',
    publishedAt: '2026-04-25',
    updatedAt: '2026-05-18',
    heroImage: HERO,
    keywords: ['langkawi hotel car delivery', 'car rental delivered to hotel langkawi'],
    excerpt: 'Skip the taxi from LGK — we bring the car to your lobby.',
    lead:
      'Hotel car delivery in Langkawi is included free with Car XQ bookings. Select your hotel at checkout or message us the property name — we meet you at reception or the security gate with the vehicle ready.',
    sections: [
      { type: 'h2', text: 'Resorts we deliver to daily' },
      {
        type: 'ul',
        items: [
          'Pantai Cenang & Tengah strips',
          'The Datai, Four Seasons, St Regis (north)',
          'Kuah town hotels and homestays',
          'Airport and ferry jetty (same free policy)',
        ],
      },
      { type: 'h2', text: 'Return pickup' },
      {
        type: 'p',
        text:
          'We can collect from the same hotel at end of rental — specify when booking. Early flight? Airport return still available 24/7.',
      },
    ],
  }),

  post({
    slug: 'langkawi-weekly-monthly-car-rental',
    title: 'Weekly & Monthly Car Rental Langkawi',
    metaTitle: 'Weekly & Monthly Car Rental Langkawi · Long-Stay Rates · Car XQ',
    metaDescription:
      'Weekly and monthly car rental Langkawi with discounted rates for 7+ and 30+ days. Ideal for remote workers, MM2H, and long holidays.',
    category: 'Pricing',
    tag: 'Long stay',
    publishedAt: '2026-04-28',
    updatedAt: '2026-05-20',
    heroImage: HERO,
    keywords: ['weekly car rental langkawi', 'monthly car rental langkawi', 'long term car hire langkawi'],
    excerpt: 'Staying a week or a month? Here is how pricing breaks down.',
    lead:
      'Weekly car rental in Langkawi drops the daily average by 10–20%; monthly agreements save more for stays of 30+ days. Long-stay renters include remote workers, MM2H holders, and families on extended school holidays.',
    sections: [
      { type: 'h2', text: 'Who benefits from weekly rates' },
      {
        type: 'p',
        text:
          'Trips of 7–14 days, wedding groups on island for a week, and repeat visitors who base in one villa and explore daily.',
      },
      { type: 'h2', text: 'Monthly rental logistics' },
      {
        type: 'p',
        text:
          'Contact us for 30+ day quotes — includes scheduled maintenance swap if needed. Insurance terms may differ; we document everything in writing before handover.',
      },
    ],
  }),

  post({
    slug: 'langkawi-car-rental-child-seat',
    title: 'Langkawi Car Rental with Child Seat',
    metaTitle: 'Langkawi Car Rental Child Seat · Family Extras · Car XQ',
    metaDescription:
      'Add a child seat to your Langkawi car rental. Rear-facing and booster options, installed before pickup at airport or hotel.',
    category: 'Planning',
    tag: 'Family',
    publishedAt: '2026-05-02',
    updatedAt: '2026-05-20',
    heroImage: blogImage('Wildlife Park.png'),
    keywords: ['langkawi car rental child seat', 'baby seat car rental langkawi', 'family car seat langkawi'],
    excerpt: 'Rear-facing, forward-facing, and booster — fitted before you drive off.',
    lead:
      'Langkawi car rental with child seat is available on request at booking — small daily fee per seat. We install before handover at LGK, the jetty, or your hotel so you never fit a seat in 35°C heat with jet-lagged kids.',
    sections: [
      { type: 'h2', text: 'Seat types' },
      {
        type: 'ul',
        items: [
          'Rear-facing infant (0–13 kg)',
          'Forward-facing toddler (9–18 kg)',
          'Booster (15–36 kg)',
        ],
      },
      { type: 'h2', text: 'Malaysian law reminder' },
      {
        type: 'p',
        text:
          'Child restraint rules apply — under 135 cm or 12 years should use an appropriate seat. Police checks are infrequent but safety matters more than fines on hill roads.',
      },
    ],
  }),

  post({
    slug: 'book-car-rental-langkawi-online',
    title: 'How to Book Car Rental in Langkawi Online in 90 Seconds',
    metaTitle: 'Book Car Rental Langkawi Online · 90-Second Checkout · Car XQ',
    metaDescription:
      'Book Langkawi car rental online: pick dates, choose car, set airport or hotel pickup, pay securely. Confirmation instant. Car XQ since 2015.',
    category: 'Guides',
    tag: 'Booking',
    publishedAt: '2026-05-10',
    updatedAt: '2026-05-20',
    heroImage: HERO,
    keywords: ['book car rental langkawi online', 'langkawi car rental booking', 'online car hire langkawi'],
    excerpt: 'Dates → car → pickup → pay. The full online flow explained.',
    lead:
      'You can book car rental in Langkawi online in about 90 seconds on carxq.com: enter pickup and return dates, choose a vehicle class, set LGK Door 3 or hotel delivery, add driver details, and pay via card or FPX.',
    sections: [
      { type: 'h2', text: 'Step-by-step booking' },
      {
        type: 'ul',
        items: [
          'Search dates on the homepage booking dock',
          'Browse available fleet with live pricing',
          'Select pickup: airport, jetty, or hotel',
          'Add promo code if you have one',
          'Pay online or choose pay-at-pickup where offered',
        ],
      },
      { type: 'h2', text: 'After you book' },
      {
        type: 'p',
        text:
          'Email confirmation with booking ID arrives instantly. WhatsApp us flight changes — we adjust pickup at no fee. Manage bookings in your customer account after login.',
      },
      { type: 'h2', text: 'Modify or cancel' },
      {
        type: 'p',
        text:
          'Free cancellation 48+ hours before pickup. Inside 48 hours, contact support — we flex when ferries delay.',
      },
    ],
  }),
]

export function getBlogPosts(): BlogPost[] {
  return BLOG_POSTS
}
