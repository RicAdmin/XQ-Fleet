import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: () =>
        new Response(JSON.stringify({ status: 'ok', service: 'xqcar' }), {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-cache',
          },
        }),
    },
  },
})
