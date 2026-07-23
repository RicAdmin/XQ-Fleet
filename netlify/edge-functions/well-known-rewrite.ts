/**
 * Netlify often fails to apply toml redirects for `/.well-known/*` on SSR sites.
 * Rewrite to the undotted `/well-known/*` handlers that already return 200.
 *
 * @see https://docs.netlify.com/build/edge-functions/declarations/
 */
export default async (request: Request) => {
  const url = new URL(request.url)
  if (!url.pathname.startsWith('/.well-known')) {
    return
  }

  const target = new URL(url.href)
  target.pathname = url.pathname.replace(/^\/\.well-known(?=\/|$)/, '/well-known')
  return target
}

export const config = {
  path: '/.well-known/*',
}
