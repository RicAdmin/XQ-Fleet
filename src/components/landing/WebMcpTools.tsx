import { useEffect } from 'react'

type ModelContextTool = {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  execute: (input: Record<string, unknown>) => Promise<unknown>
}

type ModelContextApi = {
  registerTool: (tool: ModelContextTool) => () => void
}

declare global {
  interface Navigator {
    modelContext?: ModelContextApi
  }
}

const SITE_BASE = typeof window !== 'undefined' ? window.location.origin : 'https://carxq.com'

const WEB_MCP_TOOLS: ModelContextTool[] = [
  {
    name: 'search_available_cars',
    description:
      'Search XQCar Langkawi fleet availability by pickup and return date/time and optional passenger count.',
    inputSchema: {
      type: 'object',
      properties: {
        pickupDate: { type: 'string', description: 'Pickup date (YYYY-MM-DD)' },
        pickupTime: { type: 'string', description: 'Pickup time (HH:mm, 24h)' },
        returnDate: { type: 'string', description: 'Return date (YYYY-MM-DD)' },
        returnTime: { type: 'string', description: 'Return time (HH:mm, 24h)' },
        passengers: { type: 'integer', minimum: 1, maximum: 8, description: 'Number of passengers' },
      },
      required: ['pickupDate', 'returnDate'],
    },
    execute: async (input) => {
      const params = new URLSearchParams()
      if (input.pickupDate) params.set('pickup', String(input.pickupDate))
      if (input.returnDate) params.set('return', String(input.returnDate))
      if (input.pickupTime) params.set('pickupTime', String(input.pickupTime))
      if (input.returnTime) params.set('returnTime', String(input.returnTime))
      if (input.passengers) params.set('passengers', String(input.passengers))
      return {
        action: 'open_fleet_search',
        url: `${SITE_BASE}/?${params.toString()}#fleet`,
        message: 'Open the homepage fleet section with the requested dates to view live availability.',
      }
    },
  },
  {
    name: 'get_pickup_locations',
    description: 'List XQCar Langkawi pickup and return locations with meet-point details.',
    inputSchema: { type: 'object', properties: {} },
    execute: async () => ({
      locations: [
        {
          id: 'lgk-airport',
          name: 'Langkawi International Airport (LGK)',
          meetPoint: 'Door 3, Arrivals Hall',
        },
        {
          id: 'kuah-jetty',
          name: 'Kuah Ferry Jetty',
          meetPoint: 'Main terminal meet point',
        },
        {
          id: 'hotel-delivery',
          name: 'Hotel delivery',
          meetPoint: 'Island-wide by arrangement',
        },
      ],
      guideUrl: `${SITE_BASE}/guides/pickup-return`,
    }),
  },
  {
    name: 'get_driving_guides',
    description: 'Return links to XQCar Langkawi driving, routing, and know-how guides.',
    inputSchema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          enum: ['pick-car', 'pickup-return', 'plan-drive', 'know-how', 'blog'],
          description: 'Guide topic to retrieve',
        },
      },
    },
    execute: async (input) => {
      const topic = typeof input.topic === 'string' ? input.topic : 'pick-car'
      const paths: Record<string, string> = {
        'pick-car': '/guides/pick-car',
        'pickup-return': '/guides/pickup-return',
        'plan-drive': '/guides/plan-drive',
        'know-how': '/guides/know-how',
        blog: '/blog',
      }
      const path = paths[topic] ?? paths['pick-car']
      return { url: `${SITE_BASE}${path}`, topic }
    },
  },
  {
    name: 'contact_support',
    description: 'Return XQCar 24/7 roadside support and office contact details.',
    inputSchema: { type: 'object', properties: {} },
    execute: async () => ({
      phone: '+60 11 3521 5576',
      email: 'hello@carxq.my',
      hours: '24/7 roadside support',
      office: '26 & 28, 1st Floor, Jalan Pandak Mayah 4, Mukim Kuah, 07000 Langkawi, Kedah, Malaysia',
    }),
  },
]

export function WebMcpTools() {
  useEffect(() => {
    const modelContext = navigator.modelContext
    if (!modelContext?.registerTool) return

    const unregister = WEB_MCP_TOOLS.map((tool) => modelContext.registerTool(tool))
    return () => {
      unregister.forEach((off) => off())
    }
  }, [])

  return null
}
