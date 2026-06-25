import { createFileRoute } from '@tanstack/react-router'

import { publicSitePath } from '#/lib/brand'

export const Route = createFileRoute('/api/acp/checkout_sessions')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: Record<string, unknown> = {}
        try {
          body = (await request.json()) as Record<string, unknown>
        } catch {
          body = {}
        }

        const sessionId = `cs_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`

        return new Response(
          JSON.stringify(
            {
              id: sessionId,
              status: 'open',
              currency: 'MYR',
              checkout_url: publicSitePath('/book'),
              message:
                'ACP checkout session stub. Complete booking on the web checkout flow; full ACP settlement via iPay88 is in progress.',
              capabilities: {
                payment_methods: ['card', 'fpx'],
                provider: 'ipay88',
              },
              request_echo: body,
            },
            null,
            2,
          ),
          {
            status: 201,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Cache-Control': 'no-store',
            },
          },
        )
      },
    },
  },
})
