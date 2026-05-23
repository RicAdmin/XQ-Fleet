import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'

import TanStackQueryProvider from '../integrations/tanstack-query/root-provider'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

const RootDevtools = import.meta.env.DEV ? lazy(() => import('./-RootDevtools')) : null

interface MyRouterContext {
  queryClient: QueryClient
}

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async ({ location }) => {
    const search = location.search as Record<string, unknown> | undefined
    const ref = search?.ref
    if (typeof ref === 'string' && /^[a-z0-9_-]{3,32}$/.test(ref.trim())) {
      try {
        const { captureAffiliateRef } = await import('#/lib/affiliate-functions')
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
        href: '/image/xqCarLogo.png',
      },
    ],
  }),
  shellComponent: RootDocument,
})

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
