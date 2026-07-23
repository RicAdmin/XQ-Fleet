import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { lazy, Suspense } from 'react'

import { GaPageViews } from '#/components/GaPageViews'
import { NotFoundPage } from '#/components/NotFoundPage'
import { gaConfigScript, gaMeasurementId } from '#/lib/ga'
import TanStackQueryProvider from '../integrations/tanstack-query/root-provider'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

const RootDevtools = import.meta.env.DEV
  ? lazy(() => import('./-RootDevtools'))
  : null

interface MyRouterContext {
  queryClient: QueryClient
}

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

// Langkawi_Preference affiliate tracker — only rendered when both env vars
// are set, so tracking is silently skipped in environments without them.
function affiliateTrackingScript() {
  const baseUrl = import.meta.env.VITE_AFFILIATE_TRACKING_BASE_URL
  const publicKey = import.meta.env.VITE_AFFILIATE_TRACKING_PUBLIC_KEY
  if (!baseUrl || !publicKey) return null
  return {
    src: `${baseUrl.replace(/\/$/, '')}/scripts/refferq-tracker.js`,
    'data-api-key': publicKey,
    'data-api-url': baseUrl.replace(/\/$/, ''),
    defer: true,
  }
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async ({ location }) => {
    const search = location.search as Record<string, unknown> | undefined
    const ref = search?.ref
    if (typeof ref === 'string' && /^[a-z0-9_-]{3,32}$/.test(ref.trim())) {
      try {
        const { captureAffiliateRef } =
          await import('#/lib/affiliate-functions')
        await captureAffiliateRef({
          data: {
            code: ref.trim(),
            landingPath: location.pathname,
            referrer: null,
          },
        })
      } catch {
        // never block render on an attribution failure
      }
    }
  },
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'XQCar — Car Rental Langkawi',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        type: 'image/png',
        href: '/image/xqCarLogo-96.png',
      },
    ],
    scripts: [
      ...gaHeadScripts(),
      ...([affiliateTrackingScript()].filter(Boolean) as { src: string }[]),
    ],
  }),
  notFoundComponent: NotFoundPage,
  shellComponent: RootDocument,
})

function gaHeadScripts(): Array<
  { src: string; async?: boolean } | { children: string }
> {
  const id = gaMeasurementId()
  if (!id) return []
  return [
    {
      src: `https://www.googletagmanager.com/gtag/js?id=${id}`,
      async: true,
    },
    { children: gaConfigScript(id) },
  ]
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(196,120,10,0.18)]">
        <TanStackQueryProvider>
          {children}
          <GaPageViews />
          {RootDevtools ? (
            <Suspense fallback={null}>
              <RootDevtools />
            </Suspense>
          ) : null}
        </TanStackQueryProvider>
        <Scripts />
      </body>
    </html>
  )
}
