/**
 * Map RFC 8615 `/.well-known/*` URLs onto the undotted `/well-known/*` route tree.
 * TanStack cannot register dot-prefixed route files; Netlify also strips `.well-known`
 * from publishes, so SSR handlers live at `/well-known/*`.
 *
 * Kept free of Node built-ins so the client router can import it safely.
 */
export function rewriteWellKnownUrl(url: URL): URL {
  if (!url.pathname.startsWith('/.well-known')) return url
  const next = new URL(url.href)
  next.pathname = url.pathname.replace(/^\/\.well-known(?=\/|$)/, '/well-known')
  return next
}
