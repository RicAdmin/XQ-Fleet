import { createFileRoute } from '@tanstack/react-router'

import { AboutPage } from '#/components/about/AboutPage'
import { publicSitePath } from '#/lib/brand'
import { SEO_OG_IMAGE, socialImageMeta } from '#/lib/seo-meta'

export const Route = createFileRoute('/about')({
  component: AboutPage,
  head: () => ({
    meta: [
      {
        title: 'About Us — Car XQ Langkawi | Trusted Since 2015',
      },
      {
        name: 'description',
        content:
          'Car XQ is the vehicle rental arm of Xiao Qiang Holidays — family-owned in Langkawi since 2015. Owned fleet, OKU-friendly options, free airport delivery from RM 70/day.',
      },
      {
        property: 'og:title',
        content: 'About Us — Car XQ Langkawi',
      },
      {
        property: 'og:description',
        content:
          'Licensed Langkawi car rental since 2015. Owned fleet, dealer-serviced vehicles, island-wide delivery, and transparent pricing from RM 70/day.',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: publicSitePath('/about') },
      ...socialImageMeta(SEO_OG_IMAGE),
    ],
    links: [{ rel: 'canonical', href: publicSitePath('/about') }],
  }),
})
