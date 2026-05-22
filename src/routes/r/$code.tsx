import { createFileRoute, redirect } from '@tanstack/react-router'

/**
 * Affiliate short link.
 *
 * Visit `/r/abc-123` to:
 *   1. Validate the code.
 *   2. Set the `aff_ref` HttpOnly cookie (server-side, last-click wins).
 *   3. Record a click row.
 *   4. Redirect to `/` (or `?dest=` if supplied with an in-app path).
 *
 * Unknown / archived codes redirect silently to `/` — we never reveal whether
 * an affiliate code exists from the public surface.
 */
export const Route = createFileRoute('/r/$code')({
  beforeLoad: async ({ params, location }) => {
    const code = params.code.trim()
    if (!/^[a-z0-9_-]{3,32}$/.test(code)) {
      throw redirect({ to: '/' })
    }
    try {
      const { captureAffiliateRef } = await import('#/lib/affiliate-functions')
      await captureAffiliateRef({
        data: {
          code,
          landingPath: location.pathname,
          referrer: null,
        },
      })
    } catch {
      // Silent failure — still send user onward.
    }
    const search = location.search as Record<string, unknown> | undefined
    const destRaw = search?.dest
    const dest =
      typeof destRaw === 'string' && destRaw.startsWith('/') ? destRaw : '/'
    throw redirect({ href: dest })
  },
  component: () => null,
})
